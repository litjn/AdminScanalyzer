# ────────────────────────────────────────────────────────────────────────
#  Credential DAO  (app/dao/credential_dao.py)
# ────────────────────────────────────────────────────────────────────────
from __future__ import annotations

from typing import Optional

from motor.motor_asyncio import AsyncIOMotorCollection
from pymongo import ASCENDING, ReturnDocument

from app.db.mongodb import credentials_collection        # type: AsyncIOMotorCollection
from app.models.credential_model import Credential


class CredentialDAO:
    """User credential storage & validation."""

    col: AsyncIOMotorCollection = credentials_collection
    _idx_done: bool = False

    @classmethod
    async def _ensure_unique_email(cls) -> None:
        if cls._idx_done:
            return
        await cls.col.create_index([("email", ASCENDING)], unique=True)
        cls._idx_done = True

    # ───────── CRUD ───────────────────────────────────────────────────
    @classmethod
    async def add(cls, cred: Credential) -> str:
        await cls._ensure_unique_email()
        res = await cls.col.insert_one(cred.model_dump(by_alias=True))
        return str(res.inserted_id)

    @classmethod
    async def get_by_email(cls, email: str) -> Optional[Credential]:
        if (doc := await cls.col.find_one({"email": email})):
            return Credential(**doc)
        return None

    @classmethod
    async def verify(cls, email: str, password: str) -> bool:
        return await cls.col.count_documents({"email": email, "password": password}) > 0

    @classmethod
    async def update_password(cls, email: str, new_password: str) -> bool:
        res = await cls.col.find_one_and_update(
            {"email": email},
            {"$set": {"password": new_password}},
            return_document=ReturnDocument.AFTER,
        )
        return res is not None
