# ----------------------------------------------------------------------
#  Central hub for live WebSocket broadcasting
# ----------------------------------------------------------------------
from __future__ import annotations
from typing import List, Dict, Any
import json, asyncio

from fastapi.encoders import jsonable_encoder
from starlette.websockets import WebSocket

from app.services.log_processor import process
from app.utils.logger import setup_logger

logger = setup_logger()


class Streamer:
    """
    • keeps track of connected clients
    • allows pause / resume
    • enriches raw logs with AI on demand
    """

    def __init__(self) -> None:
        self.active: List[WebSocket] = []
        self.is_paused: bool = False

    # ───── WebSocket connection management ────────────────────────────
    async def connect(self, ws: WebSocket):
        await ws.accept()
        self.active.append(ws)
        logger.info("WebSocket client connected")

    async def disconnect(self, ws: WebSocket):
        if ws in self.active:
            self.active.remove(ws)
            logger.info("WebSocket client disconnected")

    # ───── Processing & broadcasting ──────────────────────────────────
    async def enrich(self, raw_log: Dict[str, Any]) -> Dict[str, Any]:
        """
        Call the OpenAI-powered processor *in a worker thread*.
        """
        return await process(raw_log)

    async def broadcast(self, message: Dict[str, Any]):
        """
        Send message to every active client unless stream is paused.
        Cleans up broken connections automatically.
        """
        if self.is_paused:
            return

        dead: list[WebSocket] = []
        payload = jsonable_encoder(message)     # datetime → ISO 8601, etc.

        for ws in self.active:
            try:
                await ws.send_json(payload)
            except Exception as exc:
                logger.error(f"WebSocket send failed: {exc}")
                dead.append(ws)

        for ws in dead:
            await self.disconnect(ws)

    # ───── external control ───────────────────────────────────────────
    async def toggle_pause(self, pause: bool):
        self.is_paused = pause
        logger.info(f"Stream {'paused' if pause else 'resumed'}")

    def is_streaming(self) -> bool:
        return not self.is_paused
