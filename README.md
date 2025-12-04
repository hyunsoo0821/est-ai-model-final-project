# 😆 웃음 참기 챌린지 (Laugh Challenge)

## 📌 프로젝트 개요
**목표**: 사용자의 **비자발적 웃음 반응**을 포착하여 기존 클릭·좋아요 기반 추천 알고리즘의 한계를 극복하고, **실제 선호도**를 반영하는 정밀 추천 시스템을 개발합니다.

- **배경**: 기존 플랫폼은 의식적 행동(좋아요, 시청 시간)에 의존 → 습관적 행동으로 인해 몰입도 반영 한계.
- **핵심 아이디어**: 웃음을 억제하는 상황에서 발생하는 **진짜 웃음**을 감지 → 추천 알고리즘에 활용.

## 🛠 기술 스택
- **Frontend**: React, Vite, Tailwind, Recharts
- **Backend**: Node.js, Express, Supabase (PostgreSQL)
- **AI Processor**: FastAPI, YOLOv8/YOLOv11n, ResNet+CBAM, OpenCV, Torch
- **LLM Analyzer**: FastAPI, Gemini 2.5 Pro, ffmpeg
- **DB**: Supabase Storage

## 📂 데이터셋
- **총 데이터**: 약 19,000 이미지 (HAPPY, SADNESS, ANGER, PANIC)
- **전처리**: 크롭핑, 세그멘테이션, 라벨 검증(다수결)
- **클래스**: 4-class → 2-class (웃음 vs 기타)
- **불균형 처리**: 추가 웃음 데이터 확보 및 증강

## 🔍 모델링
- **사용 모델**: ResNet + CBAM (최종 선정)
- **비교 모델**: EfficientNet, EfficientFormer, MobileViT
- **성능**:
  - Accuracy: **98%**
  - F1-score: Happy 0.96 / Other 0.99
- **추론 속도**: 모든 모델 200ms 내 처리 가능

## 🌐 서비스 흐름
1. **웹캠 캡처** (200ms 주기)
2. **YOLO 얼굴 탐지 → 웃음 이벤트 감지**
3. **DB 저장 → LLM 분석 → 추천 영상 제공**
4. **UI**: 실시간 웃음 기록, 추천 영상, 성향 분석 리포트

## 🚀 기대 효과
- 추천 알고리즘의 **정확도 및 신뢰도 향상**
- 사용자 경험 개선 → 체류 시간 증가
- 다양한 산업 확장 가능 (광고, 교육, 엔터테인먼트)

## 🔮 Future Works
- **멀티모달 분석**: 시선, 음성, 움직임 통합
- **개인화 추천 엔진**: 초단위 맞춤형 추천
- **감정 클래스 확장**: 웃음 MBTI 기반 프로파일링

## 📎 참고 자료
- [Nonverbal Leakage and Clues to Deception](https://www.paulekman.com/wp-content/uploads/2013/07/Nonverbal-Leakage-And-Clues-To-Deception.pdf)
- The Psychology of Humor: An Integrative Approach (Rod A. Martin, 2010)
