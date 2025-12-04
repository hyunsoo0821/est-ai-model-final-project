from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from AI_pipeline.routes.laugh_event import router as laugh_router

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# 라우트 등록
app.include_router(laugh_router)

@app.get("/")
def root():
    return {"status": "OK"}
