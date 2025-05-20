# ────────────────────────────────────────────────────────────────────────
#  MongoDB helper (app/db/mongodb.py)
# ────────────────────────────────────────────────────────────────────────
from __future__ import annotations

import os
from functools import lru_cache
from typing import Final

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorCollection
from dotenv import load_dotenv

load_dotenv()

MONGO_URI: Final[str] = os.getenv("MONGO_URI", "mongodb://localhost:27017")
DB_NAME: Final[str]   = os.getenv("MONGO_DB", "ScanalyzerDB")

_client: AsyncIOMotorClient | None = None


def _init_client() -> AsyncIOMotorClient:
    """Singleton connection reused across the entire app."""
    global _client
    if _client is None:
        _client = AsyncIOMotorClient(MONGO_URI, tz_aware=True)
    return _client


@lru_cache(maxsize=None)
def get_collection(name: str) -> AsyncIOMotorCollection:  # noqa: D401
    """Return (and memoise) a collection handle."""
    return _init_client()[DB_NAME][name]


# Pre‑alloc common handles for convenience
log_collection         = get_collection("logs")
credentials_collection = get_collection("credentials")