# AI_pipeline/core/ai_module.py

import os
import time
import json
from google import genai
from dotenv import load_dotenv
from google.genai import types

# .env 로드
load_dotenv("/workspace/AI_emotion_browser/AI_pipeline/.env")

API_KEY = os.getenv("GOOGLE_API_KEY")

if not API_KEY:
    raise RuntimeError("❌ GOOGLE_API_KEY is missing!")

client = genai.Client(api_key=API_KEY)


# ------------------------------------------------------------
# 1) Gemini Files Upload
# ------------------------------------------------------------
def upload_frames_to_gemini(frame_paths):
    uploaded_ids = []

    for path in frame_paths:
        uploaded = client.files.upload(
            file=path,
            #mime_type="image/jpeg"
        )
        uploaded_ids.append(uploaded.name)
        print("📤 업로드됨:", uploaded.name)

    return uploaded_ids


# ------------------------------------------------------------
# 2) Files ACTIVE 대기
# ------------------------------------------------------------
def wait_until_active(file_ids):
    print("⏳ File 상태 확인 중…")

    for fid in file_ids:
        while True:
            f = client.files.get(name=fid)
            print(f" ➤ {fid} 상태: {f.state}")

            if f.state == "ACTIVE":
                break
            elif f.state == "FAILED":
                raise RuntimeError(f"❌ 파일 처리 실패: {fid}")

            time.sleep(0.3)

    print("🎉 모든 파일 ACTIVE!")


# ------------------------------------------------------------
# 3) LLM 분석
# ------------------------------------------------------------
PROMPT = """
다음 이미지 시퀀스를 분석해서 사용자가 어떤 장면에서 웃었는지 JSON 형태로 정확히 출력해줘.

출력 형식은 반드시 아래 3개만 포함한다:

1) "tags": 이미지 시퀀스와 비슷한 Youtube 콘텐츠 검색 추천용 명사형 태그 배열 (예: ["포장마차", "커플", "웃긴영상"])
2) "labels": 아래 5가지 중 해당되는 라벨만 포함하는 배열  
   허용된 라벨:
   ['병맛','팩트폭격','공감','슬랩스틱','상황개그']

   ⚠️ 규칙:
   - 여러 라벨이 동시에 가능하다.
   - 5가지 라벨 목록에 없는 라벨은 전부 제거한다.
   - 적합한 라벨이 없으면 빈 배열 []로 출력한다.

3) "summary": 사용자가 어떤 장면에서 웃었는지 한 문장 요약

출력 예시는 아래 형식을 따라야 하며 설명 없이 JSON만 반환하라:

{
  "tags": ["명사1", "명사2","명사3"],
  "labels": ["병맛", "상황개그"],
  "summary": "짧은 설명"
}

설명 없이 JSON만 출력하라.
"""



def analyze_frames_with_llm(file_ids):
    contents = [client.files.get(name=fid) for fid in file_ids]

    schema = types.Schema(
    type=types.Type.OBJECT,
    properties={
        "tags": types.Schema(
            type=types.Type.ARRAY, 
            items=types.Schema(type=types.Type.STRING)
        ),
        "labels": types.Schema(
            type=types.Type.ARRAY, 
            items=types.Schema(type=types.Type.STRING)
        ),
        "summary": types.Schema(type=types.Type.STRING)
    },
    required=["tags", "labels", "summary"]
)

    response = client.models.generate_content(
        model="models/gemini-2.5-pro",
        contents=contents + [PROMPT],
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=schema
        ),
    )

    print("🎯 LLM Structured Output:", response)

    # ⚠️ 실제 JSON string 추출
    json_text = response.candidates[0].content.parts[0].text

    # dict로 파싱
    data = json.loads(json_text)

    return {
        "tags": data.get("tags", []),
        "labels": data.get("labels", []),
        "summary": data.get("summary", ""),
    }
# ------------------------------------------------------------
# 4) Files 삭제
# ------------------------------------------------------------
def cleanup_gemini_files(file_ids):
    for fid in file_ids:
        client.files.delete(name=fid)
        print("🗑️ 삭제됨:", fid)
