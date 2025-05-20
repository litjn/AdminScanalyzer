# ────────────────────────────────────────────────────────────────────────
# 🔹 app/services/log_processor.py
# ────────────────────────────────────────────────────────────────────────

"""Validate raw log → classify → enrich → optional alert send."""
from __future__ import annotations

from typing import Dict, Any
import asyncio
from pydantic import ValidationError

from app.models.log_model import LogEntry
from app.utils.event_mapper import get_event_description
from .openai_client import classify_log, _CLASS_LABEL
from .alert_mailer import dispatch_alert

ALERT_CLASSES: set[str] = {"critical", "anomaly"}

async def enrich(log_data: Dict[str, Any]) -> Dict[str, Any]:
    """Pure enrichment – no DB or streamer side‑effects."""
    raw = LogEntry(**log_data)  # raises ValidationError if bad
    ai   = await asyncio.to_thread(classify_log, raw.dict(by_alias=True))

    enriched: Dict[str, Any] = {
        **raw.dict(by_alias=True),
        "event_description": get_event_description(raw.event_id),
        "ai_classification": ai["classification"],
        "ai_description":    ai["description"],
        "alert":             ai["classification"] in ALERT_CLASSES,
    }
    return enriched

async def process_and_maybe_alert(log_data: Dict[str, Any]) -> Dict[str, Any]:
    enriched = await enrich(log_data)
    if enriched["alert"]:
        await dispatch_alert(enriched)
    return enriched

__all__ = ["enrich", "process_and_maybe_alert"]
