from pydantic import BaseModel, Field
from datetime import datetime
from typing import List, Optional




class FullLogEntry(BaseModel):
    id: Optional[str] = Field(alias="_id")
    agent_id: str
    record_id: int
    timestamp: datetime
    channel: str
    event_id: int
    provider: str
    event_host: str
    user_sid: Optional[str] = None
    level: Optional[str] = None
    level_code: int
    message: List[str]
    alert: Optional[bool] = None
    ai_classification: Optional[str] = None
    trigger: Optional[bool] = None
    description: Optional[str] = None

    class Config:
        extra = "forbid"