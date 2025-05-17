from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import log_routes, model_routes
from app.api.stream_routes import stream_router
from pathlib import Path
app = FastAPI(title="Scanalyzer API")


origins = ["http://localhost:5173", "*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


BASE_DIR = Path(__file__).resolve().parent  # this points to AdminScanalyzer/app
MODEL_DIR = BASE_DIR / "ai"

pipeline_path = MODEL_DIR / "log_pipeline.pkl"
encoder_path = MODEL_DIR / "label_encoder.pkl"



app.include_router(log_routes.router)
app.include_router(stream_router)
app.include_router(model_routes.router)



@app.get("/")
async def root():
    return {"message": "FastAPI server running!"}