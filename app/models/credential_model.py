from __future__ import annotations
from typing import Optional
from pydantic import BaseModel, EmailStr, Field


class Credential(BaseModel):
    """
    Stored in MongoDB 'credentials' collection
    (plain-text password for demo simplicity – hash in prod!)
    """
    id: Optional[str] = Field(alias="_id")
    email: EmailStr
    password: str

    class Config:
        populate_by_name = True
        extra = "forbid"


class LoginRequest(BaseModel):
    email: EmailStr
    password: str
