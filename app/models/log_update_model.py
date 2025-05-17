# ----------------------------------------------------------------------
#  PATCH-style updates – user can flag or re-classify after review
# ----------------------------------------------------------------------
from typing import Optional

from pydantic import BaseModel


class LogUpdate(BaseModel):
    alert:            Optional[bool] = None
    ai_classification: Optional[str] = None    # "normal"|"suspicious"|...
    ai_description:    Optional[str] = None    # short explanation
    trigger:           Optional[bool] = None
