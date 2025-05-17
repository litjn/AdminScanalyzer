"""
Enrich a raw LogEntry with:
  • OpenAI classification + short reason
  • human-readable event-ID description
  • alert / trigger flags
Returns a dict ready for FullLogEntry(**dict).
"""
from __future__ import annotations
from typing import Dict

import asyncio
from pydantic import ValidationError

from app.models.log_model import LogEntry
from app.services.openai_classifier import classify_log           # ← our wrapper
from app.utils.event_mapper import get_event_description          # keeps your map

# ─────── Configurable knobs ────────────────────────────────────────────────
ALERT_CLASSES   = {"critical", "anomaly"}       # tweak as you like
DEFAULT_TRIGGER = False


async def process(log_data: Dict) -> Dict:
    """
    Validate → call OpenAI in a background thread → merge enrichment.
    Raises ValidationError on bad input, propagates other errors upward.
    """
    # 1) pydantic validation (fast, non-blocking)
    try:
        raw = LogEntry(**log_data)        # may raise ValidationError
    except ValidationError as exc:
        raise

    # 2) GPT-4o-mini classification (blocking ⇒ offload)
    ai = await asyncio.to_thread(classify_log, raw.dict(by_alias=True))
    # ai == {"classification": "...", "description": "..."}

    # 3) domain-specific enrichment
    enriched: Dict = {
        **raw.dict(by_alias=True),                  # validated original
        "event_description": get_event_description(raw.event_id),
        "ai_classification": ai["classification"],
        "ai_description":    ai["description"],
        "alert":             ai["classification"] in ALERT_CLASSES,
        "trigger":           DEFAULT_TRIGGER,
    }
    return enriched
