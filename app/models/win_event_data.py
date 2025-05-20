# ────────────────────────────────────────────────────────────────────────
#  app/models/win_event_data.py
# ────────────────────────────────────────────────────────────────────────

from __future__ import annotations
from typing import List, Optional
from pydantic import BaseModel, Field

class WinEventData(BaseModel):
    """Nested structure inside every Windows Event Log."""

    task_category: Optional[str] = None
    keywords: List[str] = Field(default_factory=list)
    opcode: Optional[int] = None
    process_id: Optional[int] = None
    logon_type: Optional[str] = None
    source_ip: Optional[str] = None

# Export list so `from win_event_data import WinEventData` works nicely.
__all__ = ["WinEventData"]