from fastapi import APIRouter
from pydantic import BaseModel
from AI_pipeline.core.pipeline import run_llm_pipeline

router = APIRouter()

class LlmRequest(BaseModel):
    event_id: int
    start_time: float
    end_time: float

@router.post("/laugh-event")
async def process_laughter_event(body: LlmRequest):
    result = run_llm_pipeline(body.start_time, body.end_time)

    # Python은 DB 접근 안함 → Node 5001에 JSON만 반환
    return {
        "success": True,
        "event_id": body.event_id,
        "tags": result["tags"],
        "label": result["labels"],
        "summary": result["summary"],
    }
