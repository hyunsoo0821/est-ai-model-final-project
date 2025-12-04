# AI_pipeline/core/pipeline.py

from AI_pipeline.core.timer_module import extract_frames, get_frame_paths
from AI_pipeline.core.ai_module import (
    upload_frames_to_gemini,
    wait_until_active,
    analyze_frames_with_llm,
    cleanup_gemini_files
)

VIDEO_PATH = "/workspace/AI_emotion_browser/AI_pipeline/video/ppangppangi2.mp4"


def run_llm_pipeline(start, end):
    """시작/끝 초 입력받고 → 프레임 추출 → LLM 분석"""
    extract_frames(VIDEO_PATH, start, end, fps=2)

    frames = get_frame_paths()
    if not frames:
        raise RuntimeError("❌ 프레임 추출 실패 — 파일이 없음.")

    file_ids = upload_frames_to_gemini(frames)
    wait_until_active(file_ids)

    llm_result = analyze_frames_with_llm(file_ids)

    cleanup_gemini_files(file_ids)

    return llm_result


if __name__ == "__main__":
    print("🔥 LLM 파이프라인 단독 실행 테스트!")
    result = run_llm_pipeline(12, 16)
    print("🎉 결과:", result)
