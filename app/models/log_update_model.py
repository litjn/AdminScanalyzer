# ────────────────────────────────────────────────────────────────────────
#  app/models/log_update_model.py  (PATCH payload)
# ────────────────────────────────────────────────────────────────────────

from __future__ import annotations
from typing import Optional, Literal
from pydantic import BaseModel

_CLASS_LABEL = Literal["normal", "suspicious", "anomaly", "critical"]

class LogUpdate(BaseModel):
    """Partial update sent from analyst dashboard (PATCH)."""

    alert: Optional[bool] = None
    ai_classification: Optional[_CLASS_LABEL] = None
    ai_description: Optional[str] = None

__all__ = ["LogUpdate"]
