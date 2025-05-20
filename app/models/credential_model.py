# ────────────────────────────────────────────────────────────────────────
#  app/models/credential_model.py
# ────────────────────────────────────────────────────────────────────────

from __future__ import annotations
from typing import Optional
from pydantic import BaseModel, EmailStr, Field

class Credential(BaseModel):
    """User credential (⚠ store *hashed* passwords in prod)."""

    id: Optional[str] = Field(alias="_id")
    email: EmailStr
    password: str

class LoginRequest(BaseModel):
    """Login payload sent by frontend."""

    email: EmailStr
    password: str

__all__ = ["Credential", "LoginRequest"]