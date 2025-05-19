# ----------------------------------------------------------------------
#  Fully-enriched document that is stored & streamed
# ----------------------------------------------------------------------
from __future__ import annotations
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field

from app.models.log_model import WinEventData


class FullLogEntry(BaseModel):
    id:          Optional[str] = Field(alias="_id")
    agent_id:    str
    record_id:   int
    timestamp:   datetime
    channel:     str
    event_id:    int
    provider:    str
    event_host:  str
    user_sid:    Optional[str] = None
    level:       str
    level_code:  int
    message:     List[str]
    win_event_data: WinEventData
    event_description: str

    # ───── AI-added fields ────────────────────────────────────────────
    ai_classification: str                     # required after enrichment
    ai_description:    str
    alert:             Optional[bool] = False  # human toggle
    trigger:           Optional[bool] = False  # human toggle

    class Config:
        populate_by_name = True
        extra = "forbid"
