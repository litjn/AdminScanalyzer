
# ────────────────────────────────────────────────────────────────────────
#  app/models/full_log.py    (Enriched + stored)
# ────────────────────────────────────────────────────────────────────────

from __future__ import annotations
from typing import Literal
from pydantic import Field

from .log_model import LogEntry

_CLASS_LABEL = Literal["normal", "suspicious", "anomaly", "critical"]

class FullLogEntry(LogEntry):
    """Log after pipeline enrichment; stored in Mongo & broadcast."""

    event_description: str
    ai_classification: _CLASS_LABEL
    ai_description: str
    alert: bool = False

__all__ = ["FullLogEntry"]
