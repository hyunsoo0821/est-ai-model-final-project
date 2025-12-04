import os
import base64
import io
import numpy as np
from PIL import Image
import torch
import torch.nn as nn
from torchvision import transforms, models
from fastapi import FastAPI
from pydantic import BaseModel
from ultralytics import YOLO
from huggingface_hub import hf_hub_download
from fastapi.middleware.cors import CORSMiddleware

# ================================
# GPU 체크
# ================================
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
print("🚀 Using device:", DEVICE)

# ================================
# 경로 안전하게 읽기
# ================================
BASE_DIR = os.path.dirname(os.path.abspath(__file__))  # server/
MODEL_PATH = os.path.join(BASE_DIR, "Res_CBAM_v3_epc10.pth")

# ================================
# FastAPI
# ================================
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ================================
# 1) YOLO Face Detection (GPU)
# ================================

'''
print("📥 YOLOv8 Face 모델 다운로드 중...")
yolo_path = hf_hub_download(
    repo_id="Reshma67/yolov8-face-detection",
    filename="model.pt"
)

yolo_model = YOLO(yolo_path)
yolo_model.to(DEVICE)
'''

# ================================
# 1) YOLO Face Detection (GPU)
# ================================
print("📥 YOLOv11n Face 모델 다운로드 중...")

yolo_path = hf_hub_download(
    repo_id="AdamCodd/YOLOv11n-face-detection",
    filename="model.pt"
)

yolo_model = YOLO(yolo_path)
yolo_model.to(DEVICE)


# ================================
# 2) ResNetCBAM 정의
# ================================
class ChannelAttention(nn.Module):
    def __init__(self, in_planes, ratio=16):
        super().__init__()
        self.avg_pool = nn.AdaptiveAvgPool2d(1)
        self.max_pool = nn.AdaptiveMaxPool2d(1)
        self.fc = nn.Sequential(
            nn.Conv2d(in_planes, in_planes // ratio, 1, bias=False),
            nn.ReLU(),
            nn.Conv2d(in_planes // ratio, in_planes, 1, bias=False)
        )
        self.sigmoid = nn.Sigmoid()

    def forward(self, x):
        return self.sigmoid(self.fc(self.avg_pool(x)) + self.fc(self.max_pool(x)))

class SpatialAttention(nn.Module):
    def __init__(self, kernel_size=7):
        super().__init__()
        self.conv1 = nn.Conv2d(2, 1, kernel_size, padding=kernel_size//2, bias=False)
        self.sigmoid = nn.Sigmoid()

    def forward(self, x):
        avg_out = torch.mean(x, dim=1, keepdim=True)
        max_out, _ = torch.max(x, dim=1, keepdim=True)
        return self.sigmoid(self.conv1(torch.cat([avg_out, max_out], dim=1)))

class CBAM(nn.Module):
    def __init__(self, in_planes):
        super().__init__()
        self.ca = ChannelAttention(in_planes)
        self.sa = SpatialAttention()

    def forward(self, x):
        return x * self.ca(x) * self.sa(x)

class ResNetCBAM(nn.Module):
    def __init__(self, num_classes=2):
        super().__init__()
        base = models.resnet18(weights=models.ResNet18_Weights.IMAGENET1K_V1)

        self.conv1 = base.conv1
        self.bn1 = base.bn1
        self.relu = base.relu
        self.maxpool = base.maxpool
        self.layer1 = base.layer1
        self.layer2 = base.layer2
        self.cbam2 = CBAM(128)
        self.layer3 = base.layer3
        self.cbam3 = CBAM(256)
        self.layer4 = base.layer4
        self.avgpool = base.avgpool
        self.fc = nn.Linear(base.fc.in_features, num_classes)

    def forward(self, x):
        x = self.relu(self.bn1(self.conv1(x)))
        x = self.maxpool(x)
        x = self.layer1(x)
        x = self.layer2(x)
        x = self.cbam2(x)
        x = self.layer3(x)
        x = self.cbam3(x)
        x = self.layer4(x)
        x = self.avgpool(x)
        return self.fc(torch.flatten(x, 1))

# ================================
# 3) ResNetCBAM Load (GPU)
# ================================
emotion_model = ResNetCBAM(num_classes=2)
emotion_model.load_state_dict(torch.load(MODEL_PATH, map_location=DEVICE))
emotion_model.to(DEVICE)
emotion_model.eval()

# ================================
# Transform
# ================================
transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406],
                         [0.229, 0.224, 0.225])
])

# ================================
# Request Body
# ================================
class Frame(BaseModel):
    image: str

# ================================
# /predict
# ================================
@app.post("/predict")
def predict(frame: Frame):
    try:
        base64_data = frame.image.split(",")[-1]
        img_bytes = base64.b64decode(base64_data)
        img = Image.open(io.BytesIO(img_bytes)).convert("RGB")
        img_np = np.array(img)

        # ================================
        # YOLO 얼굴 검출
        # ================================
        results = yolo_model.predict(img_np, imgsz=320, device=DEVICE, verbose=False)
        boxes = results[0].boxes.xyxy.cpu().numpy()

        # 얼굴 없음
        if len(boxes) == 0:
            print("\n[YOLO] 얼굴 없음")
            return {"emotion": "other", "prob": 0.0}

        # 가장 큰 박스 선택
        x1, y1, x2, y2 = map(int, sorted(
            boxes, key=lambda b: (b[2]-b[0])*(b[3]-b[1]), reverse=True
        )[0])

        w = x2 - x1
        h = y2 - y1

        # 얼굴이 너무 작으면 분석 안 함
        if w < 80 or h < 80:
            print(f"\n[YOLO] 얼굴이 너무 작습니다. (width={w}, height={h})")
            return {"emotion": "other", "prob": 0.0}

        # ================================
        # Crop
        # ================================
        crop = img_np[y1:y2, x1:x2]

        if crop.size == 0:
            print("\n[YOLO] Crop 실패 (잘못된 박스)")
            return {"emotion": "other", "prob": 0.0}

        # ================================
        # Emotion Model
        # ================================
        crop_tensor = transform(Image.fromarray(crop)).unsqueeze(0).to(DEVICE)

        with torch.no_grad():
            output = emotion_model(crop_tensor)
            prob = torch.softmax(output, dim=1)[0][1].item()

        label = "laugh" if prob > 0.43 else "other"


        print(f"\n[EMOTION] prob={prob:.4f} → label={label}")

        return {"emotion": label, "prob": prob}

    except Exception as e:
        print("❌ PREDICT ERROR:", e)
        return {"emotion": "error", "prob": -1}