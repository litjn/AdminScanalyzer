# ────────────────────────────────────────────────────────────────────────
# 🔹 app/services/streamer.py
# ────────────────────────────────────────────────────────────────────────

"""Global WebSocket hub – enrich raw logs & broadcast to clients."""
from __future__ import annotations

import asyncio, json
from typing import List, Dict, Any

from fastapi.encoders import jsonable_encoder
from starlette.websockets import WebSocket

from app.utils.logger import setup_logger
from .log_processor import enrich

logger = setup_logger()

class Streamer:
    def __init__(self) -> None:
        self.active: List[WebSocket] = []
        self.paused: bool = False

    # ───── WS connection management ───────────────────────────────────
    async def connect(self, ws: WebSocket):
        await ws.accept()
        self.active.append(ws)
        logger.info("WebSocket connected")

    async def disconnect(self, ws: WebSocket):
        if ws in self.active:
            self.active.remove(ws)
            logger.info("WebSocket disconnected")

    # ───── Pause / resume ──────────────────────────────────────────────
    async def toggle_pause(self, pause: bool):
        self.paused = pause
        logger.info("Stream %s", "paused" if pause else "resumed")

    # ───── Enrich API (optional external use) ─────────────────────────
    async def enrich(self, raw_log: Dict[str, Any]) -> Dict[str, Any]:
        return await enrich(raw_log)

    # ───── Broadcast ---------------------------------------------------
    async def broadcast(self, message: Dict[str, Any]):
        if self.paused or not self.active:
            return
        payload = jsonable_encoder(message)
        dead: list[WebSocket] = []
        for ws in self.active:
            try:
                await ws.send_json(payload)
            except Exception as exc:
                logger.error("WS send failed: %s", exc)
                dead.append(ws)
        for ws in dead:
            await self.disconnect(ws)

    # helper
    def is_streaming(self) -> bool:
        return not self.paused

# Global singleton
streamer = Streamer()

__all__ = ["streamer", "Streamer"]
