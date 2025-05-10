from typing import Optional, List
from pydantic import BaseModel


class LogUpdate(BaseModel):
    # Discovered that in Pydantic v1 a field with Optional is still required unless given None as default value
    level:   Optional[str]              = None
    alert:   Optional[bool]             = None
    ai_classification: Optional[str]    = None
    trigger: Optional[bool]             = None

