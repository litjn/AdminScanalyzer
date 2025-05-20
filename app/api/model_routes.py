# ────────────────────────────────────────────────────────────────────────
#  Model routes (app/api/model_routes.py)
# ────────────────────────────────────────────────────────────────────────
from __future__ import annotations

import asyncio
from typing import Any, Dict, List

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel

from app.models.log_model import LogEntry
from app.services.openai_client import classify_log

router_model = APIRouter(prefix="/model", tags=["Model"])


class ClassifyResponse(BaseModel):
    classification: str
    description: str


@router_model.post("/classify", response_model=ClassifyResponse)
async def classify_endpoint(log: LogEntry):
    """Pure classification – no DB writes."""
    try:
        return await asyncio.to_thread(classify_log, log.dict(by_alias=True))
    except Exception as exc:
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc))


@router_model.post("/classify/bulk", response_model=List[ClassifyResponse])
async def classify_bulk(logs: List[LogEntry]):
    if not logs:
        raise HTTPException(400, detail="Empty payload")

    async def _one(lg: LogEntry):
        return await asyncio.to_thread(classify_log, lg.dict(by_alias=True))

    try:
        return await asyncio.gather(*(_one(l) for l in logs))
    except Exception as exc:
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc))