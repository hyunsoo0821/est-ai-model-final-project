#!/bin/bash

SESSION="laugh"

# 세션이 이미 있으면 kill 후 재생성
tmux has-session -t $SESSION 2>/dev/null
if [ $? == 0 ]; then
    echo "🔥 기존 laugh 세션 종료"
    tmux kill-session -t $SESSION
fi

echo "🚀 새 laugh 세션 생성 중..."

# Pane 0 : Frontend
tmux new-session -d -s $SESSION "cd frontend && npm run dev"

# Pane 1 : Backend (Node)
tmux split-window -h -t $SESSION "cd backend && node server.js"

# Pane 2 : AI Python Server (실시간 웃음 감지)
tmux split-window -v -t $SESSION "cd /workspace/AI_emotion_browser/AI_realtime && uvicorn server.fastapi_server:app --host 0.0.0.0 --port 8000"


# Pane 3 : LLM 파이프라인 서버(옵션, 사용 시)
# 원래 pipeline.py는 Node에서 호출하는 모듈이라 서버 필요 없음
# 혹시 별도 API로 만들려면 아래꺼 주석 해제
tmux split-window -v -t $SESSION "cd /workspace/AI_emotion_browser && uvicorn AI_pipeline.server.pipeline_server:app --host 0.0.0.0 --port 8100 --reload"

# 보기 좋게 layout 정리
tmux select-layout -t $SESSION tiled

echo "🎉 모든 서버가 실행되었습니다!"
echo ""
echo "👉 Frontend       : http://localhost:4478"
echo "👉 Node Backend   : http://localhost:5001"
echo "👉 AI Python ML   : http://localhost:8000/docs"
echo ""
echo "🔗 tmux 접속:   tmux attach -t laugh"
echo "❌ 전체 종료:   ./kill_all.sh"

# 자동으로 세션 attach
tmux attach-session -t $SESSION
