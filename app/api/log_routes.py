# app/api/log_routes.py
# -------------------------------------------------------------------------
#  Scanalyzer ‑ Admin side – Log api
# -------------------------------------------------------------------------
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query, Header, Request
from pydantic.v1 import ValidationError
from app.dao.log_dao import LogDAO
from app.models.full_log import FullLogEntry
from app.models.log_model import LogEntry
from app.models.log_update_model import LogUpdate
from app.services.log_processor import process
from app.services.pipeline import LogHandler
import asyncio
router = APIRouter(prefix="/logs", tags=["Logs"])
log_handler = LogHandler()  # Instantiate pipeline handler


# ──────────── Get ────────────────────────────────────────────────────────
@router.get("/ping", summary="Connection test endpoint for agents")
async def ping(x_api_key: str = Header(...)):
    """
    Lightweight ping endpoint for agent connectivity test.
    Returns 200 OK if API key is valid.
    """
    if x_api_key != "123123123":
        raise HTTPException(status_code=401, detail="Invalid API key")
    return {"status": "ok"}


@router.get("/{log_id}", response_model=FullLogEntry, summary="Get a specific log by ID")
async def read_log(log_id: str):
    """Return one log document by its MongoDB _id."""
    log = await LogDAO.get_log_by_id(log_id)
    if not log:
        raise HTTPException(status_code=404, detail="Log not found")
    return log


@router.get("/", response_model=List[FullLogEntry], summary="Get logs with optional filters")
async def get_logs(
    agent_id: Optional[str] = None,
    channel:  Optional[str] = None,
    level:    Optional[str] = None,
    skip: int = Query(0, ge=0, description="Number of logs to skip"),
    limit: int = Query(300, ge=1, le=1000, description="Maximum logs to return"),
):
    """
    If any filter is supplied, we call DAO filter-method. Otherwise, return all logs.
    """
    if agent_id or channel or level:
        return await LogDAO.get_logs_by_filter(agent_id, channel, level, skip, limit)
    return await LogDAO.get_all_logs(skip, limit)

# ──────────── Post ───────────────────────────────────────────────────────

@router.post("/", response_model=str, status_code=201, summary="Create a single log entry (manual)")
async def create_log(log: FullLogEntry):
    """Manually insert one log (mainly for testing)."""
    return await LogDAO.add_log(log)



@router.post("/ingest", summary="Ingest a single log")
async def ingest_log(log: LogEntry):
    """
    Ingest a single log for processing.
    """
    try:
        # Enrich the log with the pipeline while ensuring it's of type LogEntry
        enriched = await log_handler.handle(log.dict(by_alias=True), save=True)
        return {"status": "stored", "log": enriched}
    except ValidationError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Processing error: {exc}")

    return jsonable_encoder(enriched)


# ------------------------- /logs/ingest/bulk ------------------------------
@router.post("/ingest/bulk", summary="Ingest multiple logs")
async def ingest_bulk(logs: List[LogEntry]):
    """
    Bulk ingestion of logs.
    """
    if not logs:
        raise HTTPException(status_code=400, detail="Empty payload")

    try:
        enriched_logs = [await log_handler.handle(log.dict(by_alias=True), save=True) for log in logs]
        return {"status": "bulk stored", "logs": enriched_logs}
    except ValidationError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail="Bulk ingestion failed")


# ──────────── Put ────────────────────────────────────────────────────────

@router.put("/{log_id}", summary="Update selected fields of a log")
async def update_log(log_id: str, changes: LogUpdate):
    """
    Allow limited edits (alert flags, AI classification, etc.).
    """
    patch = changes.model_dump(exclude_unset=True, exclude_none=True)
    if not patch:
        raise HTTPException(status_code=400, detail="Empty update payload")
    success = await LogDAO.update_log(log_id, patch)
    if not success:
        raise HTTPException(status_code=404, detail="Log not found or not updated")
    return {"status": "updated"}

# ──────────── Delete ────────────────────────────────────────────────────

@router.delete("/{log_id}", summary="Delete a specific log by ID")
async def delete_log(log_id: str):
    """Hard‑delete one log document."""
    success = await LogDAO.delete_log(log_id)
    if not success:
        raise HTTPException(status_code=404, detail="Log not found or not deleted")
    return {"status": "deleted"}