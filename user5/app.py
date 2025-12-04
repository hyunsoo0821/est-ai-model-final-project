import streamlit as st
import os
import pandas as pd
import time
import shutil
from PIL import Image

# 이전에 만든 모델 코드를 불러옵니다 (파일명이 model.py 여야 합니다)
try:
    from model import Config, manager, list_labels
except ImportError:
    st.error("❌ 'model.py' 파일이 없습니다. 이전 코드를 'model.py'로 저장해주세요.")
    st.stop()

# =========================
# 페이지 설정
# =========================
st.set_page_config(
    page_title="AI 이미지 분류기 스튜디오",
    page_icon="🧠",
    layout="wide"
)

# 스타일 커스텀 (CSS)
st.markdown("""
    <style>
    .stButton>button {
        width: 100%;
        border-radius: 10px;
        height: 3em;
        font-weight: bold;
    }
    .success-box {
        padding: 1rem;
        background-color: #d4edda;
        color: #155724;
        border-radius: 10px;
        margin-bottom: 1rem;
    }
    </style>
    """, unsafe_allow_html=True)

# =========================
# 사이드바: 설정 영역
# =========================
with st.sidebar:
    st.title("⚙️ 모델 설정")
    
    # 1. 모델 아키텍처 선택
    st.subheader("아키텍처 선택")
    selected_model = st.selectbox(
        "사용할 모델",
        ["cbam_resnet", "mobile_vit"],
        index=0 if Config.MODEL_ARCH == "cbam_resnet" else 1,
        help="CBAM-ResNet: 밸런스형 (추천)\nMobileViT: 경량화/최신형"
    )
    
    # 설정 업데이트
    if selected_model != Config.MODEL_ARCH:
        Config.MODEL_ARCH = selected_model
        st.toast(f"모델이 {selected_model}(으)로 변경되었습니다!", icon="✅")
        manager.load_or_init_model(use_best=True) # 모델 리로드

    st.divider()

    # 2. 하이퍼파라미터
    st.subheader("학습 파라미터")
    epochs = st.number_input("에폭 (Epochs)", min_value=1, max_value=100, value=Config.EPOCHS)
    lr = st.number_input("학습률 (Learning Rate)", min_value=0.0001, max_value=0.01, value=Config.LEARNING_RATE, format="%.4f")
    
    Config.EPOCHS = epochs
    Config.LEARNING_RATE = lr

    st.divider()
    st.caption(f"현재 장치: {Config.DEVICE}")
    st.caption("Created with Streamlit & PyTorch")

# =========================
# 메인 화면: 탭 구성
# =========================
st.title("🧠 AI 이미지 분류 스튜디오")

tab1, tab2, tab3 = st.tabs(["🚀 모델 테스트 (Inference)", "🏋️ 모델 학습 (Train)", "📂 데이터셋 관리"])

# ---------------------------------------------------------
# 탭 1: 추론 (Inference)
# ---------------------------------------------------------
with tab1:
    st.header("이미지 테스트")
    st.markdown("학습된 모델에게 이미지를 보여주고 정답을 맞춰보게 합니다.")

    col1, col2 = st.columns([1, 1])
    
    with col1:
        uploaded_file = st.file_uploader("테스트할 이미지를 업로드하세요", type=["jpg", "png", "jpeg", "webp"])
        if uploaded_file:
            image = Image.open(uploaded_file).convert("RGB")
            st.image(image, caption="업로드된 이미지", use_container_width=True)
    
    with col2:
        if uploaded_file:
            if st.button("🔍 분석 시작", type="primary"):
                with st.spinner("AI가 이미지를 분석 중입니다..."):
                    # 모델 예측 실행
                    label, probs = manager.predict(image)
                    time.sleep(0.5) # UX를 위한 짧은 딜레이

                # 결과 표시
                st.success(f"예측 결과: **{label.upper()}**")
                
                # 확률 차트 만들기
                df_probs = pd.DataFrame(list(probs.items()), columns=["Class", "Confidence"])
                df_probs = df_probs.set_index("Class")
                st.bar_chart(df_probs, color="#4CAF50")
                
                # 상세 확률
                with st.expander("상세 확률 보기"):
                    st.dataframe(df_probs.style.format("{:.2%}"))
        else:
            st.info("왼쪽에서 이미지를 업로드하면 분석 결과가 여기에 나타납니다.")

# ---------------------------------------------------------
# 탭 2: 학습 (Training)
# ---------------------------------------------------------
with tab2:
    st.header("모델 학습시키기")
    st.markdown(f"현재 설정된 모델: **{Config.MODEL_ARCH}** | 에폭: **{Config.EPOCHS}**")

    # 데이터셋 상태 확인
    labels = manager._get_labels_from_disk() if hasattr(manager, '_get_labels_from_disk') else os.listdir(Config.UPLOADS_DIR) if os.path.exists(Config.UPLOADS_DIR) else []
    
    if not labels or len(labels) < 2:
        st.warning("⚠️ 학습을 시작하려면 최소 2개 이상의 클래스(폴더)에 이미지가 있어야 합니다. '데이터셋 관리' 탭으로 이동하세요.")
    else:
        col_train_btn, col_status = st.columns([1, 3])
        
        with col_train_btn:
            start_train = st.button("🔥 학습 시작", type="primary")
        
        if start_train:
            progress_bar = st.progress(0)
            status_text = st.empty()
            chart_place = st.empty()
            
            status_text.write("데이터셋 준비 중...")
            
            # Streamlit에서 로그를 실시간으로 보여주기는 어려우므로, 
            # model.py의 train_process를 직접 호출하되 예외처리
            try:
                with st.spinner(f"{Config.MODEL_ARCH} 모델 학습 중... (시간이 걸릴 수 있습니다)"):
                    # 실제 학습 함수 호출
                    manager.train_process()
                
                progress_bar.progress(100)
                st.balloons()
                st.success("🎉 학습이 완료되었습니다! '모델 테스트' 탭에서 성능을 확인해보세요.")
                
                # 학습 결과 요약
                st.json(manager.train_status)
                
            except Exception as e:
                st.error(f"학습 중 오류 발생: {e}")

# ---------------------------------------------------------
# 탭 3: 데이터셋 관리 (Data Management)
# ---------------------------------------------------------
with tab3:
    st.header("데이터셋 관리")
    st.markdown("이미지를 업로드하여 학습 데이터를 구축합니다.")

    # 1. 새 클래스 추가
    with st.expander("➕ 새로운 클래스(라벨) 추가하기", expanded=False):
        new_class_name = st.text_input("추가할 클래스 이름 (예: happy, sad)")
        if st.button("클래스 폴더 생성"):
            if new_class_name:
                path = os.path.join(Config.UPLOADS_DIR, new_class_name)
                os.makedirs(path, exist_ok=True)
                st.success(f"'{new_class_name}' 폴더가 생성되었습니다!")
                st.rerun()
            else:
                st.warning("클래스 이름을 입력하세요.")

    # 2. 이미지 업로드
    st.subheader("이미지 업로드")
    
    # 현재 존재하는 클래스 목록 가져오기
    if os.path.exists(Config.UPLOADS_DIR):
        current_classes = [d for d in os.listdir(Config.UPLOADS_DIR) if os.path.isdir(os.path.join(Config.UPLOADS_DIR, d))]
    else:
        current_classes = []

    if not current_classes:
        st.warning("생성된 클래스가 없습니다. 위에서 먼저 클래스를 추가해주세요.")
    else:
        col_sel, col_up = st.columns([1, 2])
        
        with col_sel:
            target_class = st.selectbox("이미지를 저장할 클래스 선택", current_classes)
            
            # 현재 데이터 개수 표시
            if target_class:
                cls_path = os.path.join(Config.UPLOADS_DIR, target_class)
                cnt = len(os.listdir(cls_path))
                st.metric(label=f"'{target_class}' 데이터 수", value=f"{cnt}장")

        with col_up:
            uploaded_images = st.file_uploader("이미지 선택 (여러 장 가능)", type=["jpg", "png", "jpeg"], accept_multiple_files=True)
            
            if st.button("📥 선택한 폴더에 저장"):
                if uploaded_images and target_class:
                    save_path = os.path.join(Config.UPLOADS_DIR, target_class)
                    count = 0
                    progress = st.progress(0)
                    
                    for i, img_file in enumerate(uploaded_images):
                        # 파일 저장
                        img = Image.open(img_file)
                        # 파일명 중복 방지용 timestamp
                        fname = f"{int(time.time())}_{i}_{img_file.name}"
                        img.save(os.path.join(save_path, fname))
                        count += 1
                        progress.progress((i + 1) / len(uploaded_images))
                    
                    st.success(f"{count}장의 이미지가 '{target_class}'에 저장되었습니다.")
                    time.sleep(1)
                    st.rerun()
                else:
                    st.warning("이미지를 선택해주세요.")

    # 3. 데이터셋 미리보기
    st.divider()
    st.subheader("저장된 데이터 현황")
    if current_classes:
        data_stats = []
        for cls in current_classes:
            p = os.path.join(Config.UPLOADS_DIR, cls)
            cnt = len([f for f in os.listdir(p) if f.lower().endswith(('png', 'jpg', 'jpeg'))])
            data_stats.append({"Class": cls, "Count": cnt})
        
        df_stats = pd.DataFrame(data_stats)
        st.bar_chart(df_stats.set_index("Class"))