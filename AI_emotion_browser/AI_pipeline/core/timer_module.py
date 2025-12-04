# AI_pipeline/core/timer_module.py

import os
import subprocess
from PIL import Image

# 프레임 저장 폴더
FRAME_DIR = "/workspace/AI_emotion_browser/AI_pipeline/frames"
os.makedirs(FRAME_DIR, exist_ok=True)


def extract_frames(video_path, start, end, fps=2):
    """FFmpeg로 특정 구간 프레임 추출"""
    duration = end - start

    # 기존 JPG 삭제
    for f in os.listdir(FRAME_DIR):
        if f.endswith(".jpg"):
            os.remove(os.path.join(FRAME_DIR, f))

    output_pattern = os.path.join(FRAME_DIR, "frame_%03d.jpg")

    cmd = [
        "ffmpeg",
        "-y",
        "-ss", str(start),
        "-t", str(duration),
        "-i", video_path,
        "-vf", f"fps={fps}",
        output_pattern
    ]

    subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)

    # JPEG 헤더 깨짐 방지
    normalize_all_jpg()


def normalize_all_jpg():
    """JPG 파일 깨짐 방지"""
    for filename in os.listdir(FRAME_DIR):
        if filename.endswith(".jpg"):
            path = os.path.join(FRAME_DIR, filename)
            img = Image.open(path).convert("RGB")
            img.save(path, "JPEG")


def get_frame_paths():
    """추출된 프레임 파일 경로 반환"""
    return sorted([
        os.path.join(FRAME_DIR, f)
        for f in os.listdir(FRAME_DIR)
        if f.endswith(".jpg")
    ])
