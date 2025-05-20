# ────────────────────────────────────────────────────────────────────────
#  Log routes (app/api/log_routes.py)
# ────────────────────────────────────────────────────────────────────────
from __future__ import annotations

import asyncio
from typing import List, Optional

from fastapi import APIRouter, Header, HTTPException, Query, status
from fastapi.encoders import jsonable_encoder
from pydantic import ValidationError

from app.dao.log_dao import LogDAO
from app.models.full_log import FullLogEntry
from app.models.log_model import LogEntry
from app.models.log_update_model import LogUpdate
from app.services.log_handler import LogHandler

router_logs = APIRouter(prefix="/logs", tags=["Logs"])
handler = LogHandler()

API_KEY_HEADER = "123123123"  # placeholder – replace with real auth later


# ────────── Utility -----------------------------------------------------

def _guard_api_key(key: str) -> None:
    if key != API_KEY_HEADER:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, detail="Invalid API key")


# ────────── GET ---------------------------------------------------------

@router_logs.get("/ping", summary="Agent health‑check endpoint")
async def ping(x_api_key: str = Header(...)):  # noqa: D401
    _guard_api_key(x_api_key)
    return {"status": "ok"}


@router_logs.get("/{log_id}", response_model=FullLogEntry)
async def read_log(log_id: str):
    if (log := await LogDAO.get_log_by_id(log_id)) is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Log not found")
    return log


@router_logs.get("/", response_model=List[FullLogEntry])
async def get_logs(
    agent_id: Optional[str] = None,
    channel: Optional[str] = None,
    level: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(300, ge=1, le=1000),
):
    if agent_id or channel or level:
        return await LogDAO.get_logs_by_filter(agent_id, channel, level, skip, limit)
    return await LogDAO.get_all_logs(skip, limit)


# ────────── POST / manual insert ---------------------------------------

@router_logs.post("/", response_model=str, status_code=status.HTTP_201_CREATED)
async def create_log(log: FullLogEntry):
    return await LogDAO.add_log(log)


# ────────── POST / ingest ----------------------------------------------

@router_logs.post("/ingest")
async def ingest_log(log: LogEntry):
    try:
        enriched = await handler.handle(log.dict(by_alias=True), save=True)
        return {"status": "stored", "log": enriched}
    except ValidationError as exc:
        raise HTTPException(400, detail=str(exc))
    except Exception as exc:
        raise HTTPException(500, detail=f"Processing error: {exc}")


@router_logs.post("/ingest/bulk")
async def ingest_bulk(logs: List[LogEntry]):
    if not logs:
        raise HTTPException(400, detail="Empty payload")

    try:
        tasks = [handler.handle(l.dict(by_alias=True), save=True) for l in logs]
        enriched = await asyncio.gather(*tasks)
        return {"status": "bulk stored", "logs": enriched}
    except ValidationError as exc:
        raise HTTPException(400, detail=str(exc))
    except Exception:
        raise HTTPException(500, detail="Bulk ingestion failed")


# ────────── PUT ---------------------------------------------------------

@router_logs.put("/{log_id}")
async def update_log(log_id: str, changes: LogUpdate):
    patch = changes.model_dump(exclude_unset=True, exclude_none=True)
    if not patch:
        raise HTTPException(400, detail="Empty update payload")

    if not await LogDAO.update_log(log_id, patch):
        raise HTTPException(404, detail="Log not found or not updated")
    return {"status": "updated"}


# ────────── DELETE ------------------------------------------------------

@router_logs.delete("/{log_id}")
async def delete_log(log_id: str):
    if not await LogDAO.delete_log(log_id):
        raise HTTPException(404, detail="Log not found or not deleted")
    return {"status": "deleted"}