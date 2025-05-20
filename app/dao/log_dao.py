# ────────────────────────────────────────────────────────────────────────
#  Log DAO  (app/dao/log_dao.py)
# ────────────────────────────────────────────────────────────────────────
from __future__ import annotations

from typing import List, Optional

from motor.motor_asyncio import AsyncIOMotorCollection
from pymongo import DESCENDING, ReturnDocument
from pymongo.errors import BulkWriteError, DuplicateKeyError

from app.db.mongodb import log_collection              # type: AsyncIOMotorCollection
from app.models.full_log import FullLogEntry
from app.models.log_model import LogEntry


class LogDAO:
    """All interactions with the **logs** MongoDB collection."""

    col: AsyncIOMotorCollection = log_collection
    _index_ensured: bool = False

    # ───────── Index (runs once) ───────────────────────────────────────
    @classmethod
    async def _ensure_indexes(cls) -> None:
        if cls._index_ensured:
            return
        await cls.col.create_index([("timestamp", DESCENDING)])
        cls._index_ensured = True

    # ───────── Inserts ────────────────────────────────────────────────
    @classmethod
    async def add_log(cls, log: FullLogEntry) -> str | None:
        """Insert a single enriched log; ignore duplicates."""
        await cls._ensure_indexes()
        doc = log.model_dump(by_alias=True)
        try:
            await cls.col.insert_one(doc)
            return doc["_id"]
        except DuplicateKeyError:
            return None

    @classmethod
    async def add_logs_bulk(cls, logs: List[FullLogEntry]) -> int:
        """Insert many – duplicates skipped, returns number of new docs."""
        if not logs:
            return 0
        await cls._ensure_indexes()
        docs = [l.model_dump(by_alias=True) for l in logs]
        try:
            res = await cls.col.insert_many(docs, ordered=False)
            return len(res.inserted_ids)
        except BulkWriteError as exc:
            return exc.details.get("nInserted", 0)

    # ───────── CRUD helpers ───────────────────────────────────────────
    @classmethod
    async def update_log(cls, log_id: str, patch: dict) -> bool:
        res = await cls.col.update_one({"_id": log_id}, {"$set": patch})
        return res.modified_count > 0

    @classmethod
    async def delete_log(cls, log_id: str) -> bool:
        return (await cls.col.delete_one({"_id": log_id})).deleted_count > 0

    # ───────── Getters ────────────────────────────────────────────────
    @classmethod
    async def get_log_by_id(cls, log_id: str) -> Optional[FullLogEntry]:
        if (doc := await cls.col.find_one({"_id": log_id})):
            return FullLogEntry(**doc)
        return None

    @classmethod
    async def get_logs_by_filter(
        cls,
        agent_id: Optional[str] = None,
        channel:  Optional[str] = None,
        level:    Optional[str] = None,
        skip: int = 0,
        limit: int = 300,
    ) -> List[FullLogEntry]:
        query: dict = {}
        if agent_id:
            query["agent_id"] = agent_id
        if channel:
            query["channel"] = channel
        if level:
            query["level"] = level

        cursor = (
            cls.col.find(query)
            .sort("timestamp", DESCENDING)
            .skip(skip)
            .limit(limit)
        )
        return [FullLogEntry(**doc) async for doc in cursor]

    @classmethod
    async def get_all_logs(cls, skip: int = 0, limit: int = 300) -> List[FullLogEntry]:
        cursor = (
            cls.col.find()
            .sort("timestamp", DESCENDING)
            .skip(skip)
            .limit(limit)
        )
        return [FullLogEntry(**doc) async for doc in cursor]

    # ───────── CSV Export (dev / support) ─────────────────────────────
    @classmethod
    async def export_to_csv(
        cls,
        file_path: str,
        fields: List[str],
        batch_size: int = 1000,
    ) -> None:
        import csv
        projection = {f: 1 for f in fields}
        cursor = cls.col.find({}, projection).batch_size(batch_size)
        with open(file_path, "w", newline="", encoding="utf-8") as fp:
            writer = csv.writer(fp)
            writer.writerow(fields)
            async for doc in cursor:
                writer.writerow([str(doc.get(f, "")) for f in fields])
        print(f"✅ Exported logs to {file_path}")
