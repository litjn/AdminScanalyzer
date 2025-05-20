# ────────────────────────────────────────────────────────────────────────
#  Streamer routes (app/api/streamer_routes.py)
# ────────────────────────────────────────────────────────────────────────
from __future__ import annotations

import asyncio
from typing import Any

from fastapi import APIRouter, Header, HTTPException, WebSocket, WebSocketDisconnect, status

from app.models.log_model import LogEntry
from app.services.streamer import streamer
from app.utils.logger import setup_logger

router_stream = APIRouter(prefix="/streamer", tags=["Streamer"])
logger = setup_logger()

API_KEY_STREAM = "123123123"  # TODO replace with real auth


# ────────── Helpers -----------------------------------------------------

def _check_key(key: str) -> None:
    if key != API_KEY_STREAM:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, detail="Invalid API key")


# ────────── Routes ------------------------------------------------------

@router_stream.get("/ping")
async def ping_stream(x_api_key: str = Header(...)):
    _check_key(x_api_key)
    return {"status": "streamer ready"}


@router_stream.post("/ingest", summary="Process + broadcast a single log (no DB write)")
async def ingest_streamed_log(log: LogEntry, x_api_key: str = Header(...)):
    _check_key(x_api_key)
    raw = log.dict(by_alias=True)

    try:
        enriched = await streamer.enrich(raw)
        logger.debug("Broadcasting log", extra={"log": enriched})
        await streamer.broadcast(enriched)
        return {"status": "broadcasted"}
    except Exception as exc:
        logger.error(f"Stream ingest failed: {exc}")
        raise HTTPException(500, detail="Streaming ingestion failed")


@router_stream.websocket("/logs/stream")
async def log_stream(ws: WebSocket):
    await streamer.connect(ws)
    try:
        while True:
            try:
                data: Any = await asyncio.wait_for(ws.receive_json(), timeout=1.0)
                match data.get("action"):
                    case "pause":
                        await streamer.toggle_pause(True)
                    case "resume":
                        await streamer.toggle_pause(False)
            except asyncio.TimeoutError:
                continue  # keep loop alive so broadcast tasks run
    except WebSocketDisconnect:
        await streamer.disconnect(ws)
    except Exception as exc:
        logger.error(f"WebSocket error: {exc}")
        await streamer.disconnect(ws)
