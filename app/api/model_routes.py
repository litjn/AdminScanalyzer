
import asyncio

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Header, HTTPException

from app.lstm_inference import predict_record
from app.models.full_log import FullLogEntry
from app.services.streamer import Streamer
from app.utils.logger import setup_logger
from app.models.log_model import LogEntry
from app.lstm_inference import predict_record

logger = setup_logger()
router = APIRouter(prefix="/ml", tags=["ML"])




@router.post("/classify", status_code=201, summary="Classify one log using AI model")
def classify_log(log: LogEntry):

    label = predict_record(log)  # _id preserved
    return {"label": label}
