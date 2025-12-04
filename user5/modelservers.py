import os
import json
import time
import shutil
import random
import numpy as np
from typing import List, Dict, Optional, Tuple, Any

from PIL import Image
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader, random_split, Subset
import torchvision.transforms as T
import torchvision.models as models

# =========================
# 1. Configuration (모델 선택)
# =========================
class Config:
    # ▼▼▼ "mobile_vit" 또는 "cbam_resnet" 중 선택 ▼▼▼
    MODEL_ARCH = "cbam_resnet"  
    
    # 디렉토리 설정
    BASE_DIR = os.path.abspath(os.path.dirname(__file__))
    DATA_DIR = os.path.join(BASE_DIR, "data")
    UPLOADS_DIR = os.path.join(DATA_DIR, "uploads")
    MODELS_DIR = os.path.join(BASE_DIR, "models")
    CHECKPOINTS_DIR = os.path.join(MODELS_DIR, "checkpoints")
    
    CLASS_INDEX_PATH = os.path.join(MODELS_DIR, "class_index.json")
    LAST_CKPT_PATH = os.path.join(CHECKPOINTS_DIR, "last.pt")
    BEST_CKPT_PATH = os.path.join(CHECKPOINTS_DIR, "best.pt")
    
    DEFAULT_EMOTIONS = ["angry", "disgust", "fear", "happy", "sad", "surprise", "neutral"]
    DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
    
    # MobileViT는 256x256을 권장하지만, 224도 작동합니다. 성능을 위해 256 권장.
    IMG_SIZE = 256 
    BATCH_SIZE = 32
    LEARNING_RATE = 0.0005 # 고급 모델은 학습률을 조금 낮추는 게 안전함
    EPOCHS = 15

    @classmethod
    def ensure_dirs(cls):
        os.makedirs(cls.MODELS_DIR, exist_ok=True)
        os.makedirs(cls.CHECKPOINTS_DIR, exist_ok=True)

# =========================
# 2. Custom Modules (CBAM Implementation)
# =========================
class ChannelAttention(nn.Module):
    def __init__(self, in_planes, ratio=16):
        super(ChannelAttention, self).__init__()
        self.avg_pool = nn.AdaptiveAvgPool2d(1)
        self.max_pool = nn.AdaptiveMaxPool2d(1)
        
        # MLP Shared weights
        self.fc1 = nn.Conv2d(in_planes, in_planes // ratio, 1, bias=False)
        self.relu1 = nn.ReLU()
        self.fc2 = nn.Conv2d(in_planes // ratio, in_planes, 1, bias=False)
        
        self.sigmoid = nn.Sigmoid()

    def forward(self, x):
        avg_out = self.fc2(self.relu1(self.fc1(self.avg_pool(x))))
        max_out = self.fc2(self.relu1(self.fc1(self.max_pool(x))))
        out = avg_out + max_out
        return self.sigmoid(out)

class SpatialAttention(nn.Module):
    def __init__(self, kernel_size=7):
        super(SpatialAttention, self).__init__()
        assert kernel_size in (3, 7), 'kernel size must be 3 or 7'
        padding = 3 if kernel_size == 7 else 1
        self.conv1 = nn.Conv2d(2, 1, kernel_size, padding=padding, bias=False)
        self.sigmoid = nn.Sigmoid()

    def forward(self, x):
        avg_out = torch.mean(x, dim=1, keepdim=True)
        max_out, _ = torch.max(x, dim=1, keepdim=True)
        x = torch.cat([avg_out, max_out], dim=1)
        x = self.conv1(x)
        return self.sigmoid(x)

class CBAMBlock(nn.Module):
    """ResNet BasicBlock에 CBAM을 주입하기 위한 래퍼"""
    def __init__(self, original_block, planes, ratio=16):
        super(CBAMBlock, self).__init__()
        self.original_block = original_block
        self.ca = ChannelAttention(planes, ratio)
        self.sa = SpatialAttention()

    def forward(self, x):
        # Original ResNet Block logic (without the final ReLU/Residual sometimes, but here we wrap the output)
        # ResNet BasicBlock의 forward는 보통 residual 더하기까지 포함되어 있음.
        # 하지만 CBAM은 Residual 더하기 직전에 들어가는 게 정석.
        # 여기서는 Pre-trained 가중치 보존을 위해 Block 출력값에 Attention을 적용하고, 
        # 다시 Input(Residual)을 더하는 변형된 방식을 사용하거나,
        # 단순히 Block 출력 전체에 Attention을 거는 방식을 사용합니다. 
        
        # 편의상: Output of Block -> CBAM -> Result
        out = self.original_block(x)
        
        # Attention Refinement
        out = self.ca(out) * out
        out = self.sa(out) * out
        
        # Note: 엄밀한 CBAM ResNet 구현은 BasicBlock 내부 구조를 뜯어고쳐야 하지만,
        # 전이학습(Pre-trained)을 유지하기 위해 'Block 후처리' 방식으로 적용합니다.
        return out

# =========================
# 3. Dataset & Utilities
# =========================
class FolderImageDataset(Dataset):
    def __init__(self, root_dir: str, class_to_idx: Dict[str, int], transform=None):
        self.samples = []
        self.transform = transform
        for label, idx in class_to_idx.items():
            label_dir = os.path.join(root_dir, label)
            if not os.path.isdir(label_dir): continue
            for fname in os.listdir(label_dir):
                if fname.lower().endswith(('.jpg', '.jpeg', '.png', '.webp')):
                    self.samples.append((os.path.join(label_dir, fname), idx))

    def __len__(self): return len(self.samples)
    def __getitem__(self, idx):
        fpath, label_idx = self.samples[idx]
        try: image = Image.open(fpath).convert("RGB")
        except: image = Image.new('RGB', (Config.IMG_SIZE, Config.IMG_SIZE), (0, 0, 0))
        if self.transform: image = self.transform(image)
        return image, label_idx

class TransformSubset(Dataset):
    def __init__(self, subset: Subset, transform=None):
        self.subset = subset
        self.transform = transform
    def __getitem__(self, index):
        x, y = self.subset[index]
        if self.transform: x = self.transform(x)
        return x, y
    def __len__(self): return len(self.subset)

def get_transforms(image_size: int):
    train_tf = T.Compose([
        T.Resize((image_size, image_size)),
        T.RandomHorizontalFlip(),
        T.RandomRotation(10),
        T.ColorJitter(0.2, 0.2, 0.2, 0.05),
        T.ToTensor(),
        T.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
    ])
    val_tf = T.Compose([
        T.Resize((image_size, image_size)),
        T.ToTensor(),
        T.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
    ])
    return train_tf, val_tf

def set_seed(seed: int = 42):
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    if torch.cuda.is_available(): torch.cuda.manual_seed_all(seed)

# =========================
# 4. Model Factory (Advanced Models)
# =========================
class ModelFactory:
    @staticmethod
    def create_model(model_name: str, num_classes: int) -> nn.Module:
        model_name = model_name.lower()
        model = None
        
        # --- 1. MobileViT (Vision Transformer Hybrid) ---
        if "mobile_vit" in model_name:
            try:
                # torchvision >= 0.13 필요
                model = models.mobile_vit_small(weights='DEFAULT')
                
                # MobileViT Head 수정
                in_features = model.classifier[-1].in_features
                model.classifier[-1] = nn.Linear(in_features, num_classes)
                print(f"Loaded [MobileViT Small] with {num_classes} classes.")
                
            except AttributeError:
                print("Error: Your torchvision version doesn't support MobileViT. Fallback to ResNet18.")
                return ModelFactory.create_model("resnet18", num_classes)

        # --- 2. CBAM + ResNet18 Hybrid ---
        elif "cbam" in model_name:
            # Pre-trained ResNet18 로드
            model = models.resnet18(weights='DEFAULT')
            
            # 각 Layer의 BasicBlock을 CBAMBlock으로 감싸기 (Hooking 방식보다 안전한 Layer 교체)
            def apply_cbam(layer, planes):
                new_layer = nn.Sequential()
                for i, block in enumerate(layer):
                    # 기존 블록을 CBAM 래퍼로 감쌈
                    new_layer.add_module(str(i), CBAMBlock(block, planes))
                return new_layer

            # ResNet18 구조: layer1(64), layer2(128), layer3(256), layer4(512)
            model.layer1 = apply_cbam(model.layer1, 64)
            model.layer2 = apply_cbam(model.layer2, 128)
            model.layer3 = apply_cbam(model.layer3, 256)
            model.layer4 = apply_cbam(model.layer4, 512)
            
            # Head 수정
            model.fc = nn.Linear(model.fc.in_features, num_classes)
            print(f"Loaded [CBAM-ResNet Hybrid] with {num_classes} classes.")
            
        # --- Fallback ---
        else:
            model = models.resnet18(weights='DEFAULT')
            model.fc = nn.Linear(model.fc.in_features, num_classes)
            print("Loaded default ResNet18.")
            
        return model

# =========================
# 5. Model Manager
# =========================
class ModelManager:
    def __init__(self):
        Config.ensure_dirs()
        self.model: Optional[nn.Module] = None
        self.class_to_idx: Dict[str, int] = {}
        self.idx_to_class: Dict[int, str] = {}
        self.train_status = {
            "running": False, "epoch": 0, "total_epochs": 0,
            "train_loss": 0.0, "val_loss": 0.0, "best_val_loss": float('inf'),
            "message": "idle", "model_arch": Config.MODEL_ARCH
        }

    def _load_class_index(self):
        if os.path.exists(Config.CLASS_INDEX_PATH):
            with open(Config.CLASS_INDEX_PATH, "r", encoding="utf-8") as f:
                return json.load(f)
        return {c: i for i, c in enumerate(Config.DEFAULT_EMOTIONS)}

    def load_or_init_model(self, use_best: bool = True):
        ckpt_path = Config.BEST_CKPT_PATH if use_best and os.path.exists(Config.BEST_CKPT_PATH) else Config.LAST_CKPT_PATH
        
        if not os.path.exists(ckpt_path):
            self._init_new_model()
            return

        try:
            data = torch.load(ckpt_path, map_location=Config.DEVICE)
            if data.get("model_arch") != Config.MODEL_ARCH:
                print(f"[Info] Arch change detected. Re-initializing {Config.MODEL_ARCH}...")
                self._init_new_model()
                return

            self.class_to_idx = data.get("class_to_idx", self._load_class_index())
            self.idx_to_class = {i: c for c, i in self.class_to_idx.items()}
            
            self.model = ModelFactory.create_model(Config.MODEL_ARCH, len(self.class_to_idx)).to(Config.DEVICE)
            self.model.load_state_dict(data["model_state"])
            self.model.eval()
        except Exception as e:
            print(f"Load Error: {e}. New Init.")
            self._init_new_model()

    def _init_new_model(self):
        self.class_to_idx = self._load_class_index()
        self.idx_to_class = {i: c for c, i in self.class_to_idx.items()}
        self.model = ModelFactory.create_model(Config.MODEL_ARCH, len(self.class_to_idx)).to(Config.DEVICE)
        self.model.eval()

    def train_process(self):
        try:
            set_seed(42)
            st = self.train_status
            st.update({"running": True, "epoch": 0, "total_epochs": Config.EPOCHS, 
                       "model_arch": Config.MODEL_ARCH, "message": "preparing"})

            labels = sorted([d for d in os.listdir(Config.UPLOADS_DIR) if os.path.isdir(os.path.join(Config.UPLOADS_DIR, d))])
            if not labels: labels = Config.DEFAULT_EMOTIONS
            class_to_idx = {c: i for i, c in enumerate(labels)}
            with open(Config.CLASS_INDEX_PATH, "w", encoding="utf-8") as f: json.dump(class_to_idx, f)

            train_tf, val_tf = get_transforms(Config.IMG_SIZE)
            full_ds = FolderImageDataset(Config.UPLOADS_DIR, class_to_idx)
            
            if len(full_ds) == 0: raise RuntimeError("No images found.")
            
            val_len = int(len(full_ds) * 0.2)
            tr_sub, val_sub = random_split(full_ds, [len(full_ds) - val_len, val_len])
            train_loader = DataLoader(TransformSubset(tr_sub, train_tf), batch_size=Config.BATCH_SIZE, shuffle=True)
            val_loader = DataLoader(TransformSubset(val_sub, val_tf), batch_size=Config.BATCH_SIZE, shuffle=False)

            model = ModelFactory.create_model(Config.MODEL_ARCH, len(class_to_idx)).to(Config.DEVICE)
            criterion = nn.CrossEntropyLoss()
            # MobileViT와 CBAM은 파라미터가 복잡하므로 학습률 조정 필요 (AdamW 추천)
            optimizer = optim.AdamW(model.parameters(), lr=Config.LEARNING_RATE, weight_decay=1e-4)
            
            best_val = float("inf")
            st["message"] = "training"

            for epoch in range(1, Config.EPOCHS + 1):
                st["epoch"] = epoch
                model.train()
                run_loss = 0.0
                for img, lbl in train_loader:
                    img, lbl = img.to(Config.DEVICE), lbl.to(Config.DEVICE)
                    optimizer.zero_grad()
                    out = model(img)
                    loss = criterion(out, lbl)
                    loss.backward()
                    optimizer.step()
                    run_loss += loss.item() * img.size(0)
                
                train_loss = run_loss / len(train_loader.dataset)
                st["train_loss"] = train_loss

                model.eval()
                val_run = 0.0
                with torch.no_grad():
                    for img, lbl in val_loader:
                        img, lbl = img.to(Config.DEVICE), lbl.to(Config.DEVICE)
                        val_run += criterion(model(img), lbl).item() * img.size(0)
                
                val_loss = val_run / max(1, len(val_loader.dataset))
                st["val_loss"] = val_loss

                torch.save({
                    "model_state": model.state_dict(),
                    "class_to_idx": class_to_idx,
                    "epoch": epoch,
                    "model_arch": Config.MODEL_ARCH,
                    "train_loss": train_loss, "val_loss": val_loss
                }, Config.LAST_CKPT_PATH)

                if val_loss < best_val:
                    best_val = val_loss
                    st["best_val_loss"] = best_val
                    shutil.copyfile(Config.LAST_CKPT_PATH, Config.BEST_CKPT_PATH)
                
                print(f"Epoch {epoch} [{Config.MODEL_ARCH}] Train: {train_loss:.4f} Val: {val_loss:.4f}")

            st.update({"running": False, "message": "done", "finished_at": time.time()})
            self.load_or_init_model(use_best=True)

        except Exception as e:
            print(f"Error: {e}")
            self.train_status.update({"running": False, "message": str(e)})

    def predict(self, image: Image.Image):
        if self.model is None: self.load_or_init_model()
        _, val_tf = get_transforms(Config.IMG_SIZE)
        x = val_tf(image).unsqueeze(0).to(Config.DEVICE)
        self.model.eval()
        with torch.no_grad():
            logits = self.model(x).squeeze(0).cpu().numpy()
        probs = np.exp(logits - np.max(logits))
        probs = probs / probs.sum()
        idx = int(np.argmax(probs))
        return self.idx_to_class.get(idx, "unknown"), {self.idx_to_class[i]: float(p) for i, p in enumerate(probs)}

manager = ModelManager()

if __name__ == "__main__":
    print(f"Selected Architecture: {Config.MODEL_ARCH}")
    # manager.train_process() # 학습 시작 시 주석 해제