from typing import Dict, Optional

from pydantic import ValidationError

from app.models.full_log import FullLogEntry
from app.services.log_processor import process
from app.dao.log_dao import LogDAO
from app.services.streamer import Streamer
from app.models.log_model import LogEntry
from app.services.streamer import streamer

class LogHandler:
    def __init__(self):
        self.streamer = streamer # Singleton for handling streams

    async def handle(
        self,
        raw_log: Dict,
        save: bool = True,
        stream: bool = True
    ) -> Dict:
        """
        1. Enrich log.
        2. Optionally, save to DB.
        3. Optionally, broadcast via WebSocket.
        """
        try:
            log_entry = LogEntry(**raw_log)
            enriched_data = await process(log_entry.dict(by_alias=True))
            enriched_log = FullLogEntry(**enriched_data)  # Convert dict to FullLogEntry

            if save:
                await LogDAO.add_log(enriched_log)  # Now passing a FullLogEntry instance

            if stream:
                await self.streamer.broadcast(enriched_log.dict(by_alias=True))  # Send dict

            return enriched_log.dict(by_alias=True)


        except ValidationError as exc:
            raise Exception(f"Validation error: {exc}")
        except Exception as exc:
            raise Exception(f"Unexpected processing error: {exc}")
