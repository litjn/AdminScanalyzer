# ----------------------------------------------------------------------
#  /streamer – realtime log pipeline (no DB writes)
# ----------------------------------------------------------------------
from __future__ import annotations
import asyncio

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Header, HTTPException
from app.models.log_model import LogEntry
from app.services.streamer import streamer
from app.utils.logger import setup_logger

logger = setup_logger()
stream_router = APIRouter(prefix="/streamer", tags=["Streamer"])

# simple API-key guard (replace with proper auth when ready)
API_KEY = "123123123"


# ──────────────────────────────────────────────────────────────────────
@stream_router.get("/ping")
async def ping(x_api_key: str = Header(...)):
    if x_api_key != API_KEY:
        raise HTTPException(401, detail="Invalid API key")
    return {"status": "streamer ready"}

# ----------------------------------------------------------------------
@stream_router.post("/ingest", summary="Process & broadcast a single log (no DB write)")
async def ingest_streamed_log(log: LogEntry, x_api_key: str = Header(...)):
    if x_api_key != API_KEY:
        raise HTTPException(401, detail="Invalid API key")

    raw = log.model_dump(by_alias=True)
    try:
        enriched = await streamer.enrich(raw)
        logger.debug(f"Broadcasting log: {enriched}")
        await streamer.broadcast(enriched)
        return {"status": "broadcasted"}
    except Exception as exc:
        logger.error(f"Stream ingest failed: {exc}")
        raise HTTPException(500, detail="Streaming ingestion failed")

# ----------------------------------------------------------------------
@stream_router.websocket("/logs/stream")
async def log_stream(ws: WebSocket):
    await streamer.connect(ws)
    try:
        while True:
            # listen for control messages while still allowing broadcasts
            try:
                data = await asyncio.wait_for(ws.receive_json(), timeout=1.0)
                match data.get("action"):
                    case "pause":
                        await streamer.toggle_pause(True)
                    case "resume":
                        await streamer.toggle_pause(False)
            except asyncio.TimeoutError:
                # timeout just keeps the loop alive
                continue
    except WebSocketDisconnect:
        await streamer.disconnect(ws)
    except Exception as exc:
        logger.error(f"WebSocket error: {exc}")
        await streamer.disconnect(ws)
