from typing import List

from starlette.websockets import WebSocket

from app.services.log_processor import LogProcessor
import app.utils.logger as logger
import json
from fastapi.encoders import jsonable_encoder

logger = logger.setup_logger()
class Streamer:

    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.log_processor = LogProcessor()
        self.is_paused = False

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info("WebSocket client connected.")

    async def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            logger.info("WebSocket client disconnected.")

    async def broadcast(self, message: dict):
        """
        Broadcast a message to all active WebSocket clients.
        """
        inactive_connections = []
        for conn in self.active_connections:
            try:
                # Convert the message dict, including any `datetime`, into JSON-friendly format
                serialized_message = jsonable_encoder(message)
                await conn.send_json(serialized_message)
            except Exception as e:
                logger.error(f"Failed to send message: {e}")
                inactive_connections.append(conn)

    # Cleanup inactive/disconnected connections
        for conn in inactive_connections:
            await self.disconnect(conn)

    def is_stream_active(self):
        return not self.is_paused

    async def toggle_pause(self, pause: bool):
        self.is_paused = pause
        logger.info(f"Stream {'paused' if pause else 'resumed'}.")