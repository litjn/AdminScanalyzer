from pydantic import BaseModel, Field
from datetime import datetime
from typing import List, Optional


class LogEntry(BaseModel):
    id: Optional[str] = Field(alias="_id")
    agent_id: str                         # NEW ------------
    record_id: int
    timestamp: datetime
    channel: str
    event_id: int
    provider: str  # rename source_name ➜ provider
    event_host: str                       # rename computer  ➜ event_host
    user_sid: Optional[str] = None
    level: str
    level_code: int                       # NEW ------------
    message: List[str]                    # rename msg ➜ message


    class Config:
        extra = "forbid"                  # unknown keys → 422
