# ----------------------------------------------------------------------
#  Schema for the **raw log** exactly as a user-agent POSTs it
# ----------------------------------------------------------------------
from __future__ import annotations
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field


class WinEventData(BaseModel):
    task_category: Optional[str] = None
    keywords:       List[str]    = Field(default_factory=list)
    opcode:         Optional[int] = None
    process_id:     Optional[int] = None
    logon_type:     Optional[str] = None
    source_ip:      Optional[str] = None


class LogEntry(BaseModel):
    id:          Optional[str] = Field(alias="_id")          # alias => “_id”
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

    class Config:
        validate_assignment = True
        populate_by_name    = True        # accept _id OR id
        extra               = "forbid"
