# ────────────────────────────────────────────────────────────────────────
# 🔹 app/services/log_handler.py
# ────────────────────────────────────────────────────────────────────────

"""Facade used by API layer to enrich → save → stream in one place."""
from __future__ import annotations

import asyncio
from typing import Dict, Any
from pydantic import ValidationError

from app.dao.log_dao import LogDAO
from .log_processor import process_and_maybe_alert
from app.models.full_log import FullLogEntry
from app.services.streamer import streamer

class LogHandler:
    """High‑level helper used by route `/logs/ingest`."""

    async def handle(self, raw: Dict[str, Any], *, save: bool = True, stream: bool = True) -> Dict[str, Any]:
        try:
            enriched = await process_and_maybe_alert(raw)
            if save:
                await LogDAO.add_log(FullLogEntry(**enriched)) # DAO accepts dict now
            if stream:
                await streamer.broadcast(enriched)
            return enriched
        except ValidationError as exc:
            raise Exception(f"Validation error: {exc}")
        except Exception as exc:
            raise Exception(f"Unexpected processing error: {exc}")

__all__ = ["LogHandler"]