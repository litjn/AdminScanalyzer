from __future__ import annotations
from typing import Optional

from motor.motor_asyncio import AsyncIOMotorCollection
from pymongo import ASCENDING, ReturnDocument

from app.db.mongodb import credentials_collection               # type: AsyncIOMotorCollection
from app.models.credential_model import Credential


class CredentialDAO:
    col: AsyncIOMotorCollection = credentials_collection

    # ensure unique index on e-mail (runs once, benign afterwards)
    @classmethod
    async def _ensure_index(cls):
        await cls.col.create_index([("email", ASCENDING)], unique=True)

    # ───────── CRUD helpers ────────────────────────────────────
    @classmethod
    async def add(cls, cred: Credential) -> str:
        await cls._ensure_index()
        res = await cls.col.insert_one(cred.dict(by_alias=True))
        return str(res.inserted_id)

    @classmethod
    async def get_by_email(cls, email: str) -> Optional[Credential]:
        doc = await cls.col.find_one({"email": email})
        return Credential(**doc) if doc else None

    @classmethod
    async def verify(cls, email: str, password: str) -> bool:
        doc = await cls.col.find_one({"email": email, "password": password})
        return bool(doc)

    # optional: update password
    @classmethod
    async def update_password(cls, email: str, new_password: str) -> bool:
        doc = await cls.col.find_one_and_update(
            {"email": email},
            {"$set": {"password": new_password}},
            return_document=ReturnDocument.AFTER,
        )
        return doc is not None
