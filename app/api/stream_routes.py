import asyncio

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Header, HTTPException
from app.services.streamer import Streamer
from app.utils.logger import setup_logger
from app.models.log_model import LogEntry

logger = setup_logger()
stream_router = APIRouter(prefix="/streamer", tags=["Streamer"])

streamer = Streamer()

@stream_router.get("/ping")
async def ping(x_api_key: str = Header(...)):  # Add header validation
    if x_api_key != "123123123":
        raise HTTPException(status_code=401, detail="Invalid API key")
    return {"status": "streamer ready"}

@stream_router.post("/ingest", summary="Send log to streamer for broadcast only")
async def ingest_streamed_log(log: LogEntry, x_api_key: str = Header(...)):
    """
    Agent sends a single log here. It's processed, then broadcasted (not saved).
    """

    if x_api_key != "123123123":
        raise HTTPException(status_code=401, detail="Invalid API key")
    try:
        raw_log = log.model_dump(by_alias=True)
        enriched_log = await streamer.log_processor.process(raw_log)
        logger.debug(f"Broadcasting log: {enriched_log}")
        await streamer.broadcast(enriched_log)
        return {"status": "broadcasted"}
    except Exception as e:
        logger.error(f"Stream ingest failed: {e}")
        raise HTTPException(status_code=500, detail="Streaming ingestion failed")

@stream_router.websocket("/logs/stream")
async def log_stream(websocket: WebSocket):
    await streamer.connect(websocket)
    try:
        while True:
            # Handle incoming control messages (e.g., pause/resume)
            try:
                data = await asyncio.wait_for(websocket.receive_json(), timeout=1.0)
                action = data.get("action")
                if action == "pause":
                    await streamer.toggle_pause(True)
                elif action == "resume":
                    await streamer.toggle_pause(False)
            except asyncio.TimeoutError:
                # Timeout allows the loop to continue and check for broadcasts
                continue
    except WebSocketDisconnect:
        await streamer.disconnect(websocket)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        await streamer.disconnect(websocket)
