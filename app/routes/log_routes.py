# app/routes/log_routes.py
# -------------------------------------------------------------------------
#  Scanalyzer ‑ Admin side – Log routes
#  (No API‑Key handling yet – add later if you like)
# -------------------------------------------------------------------------
from typing import List, Optional, Union

from fastapi import APIRouter, HTTPException, Query
from app.dao.log_dao        import LogDAO
from app.models.log_model   import LogEntry
from app.models.log_update_model import LogUpdate

router = APIRouter(prefix="/logs", tags=["Logs"])

# ──────────── Get ────────────────────────────────────────────────────────

@router.get("/{log_id}", response_model=LogEntry, summary="Get a specific log by ID")
async def read_log(log_id: str):
    """Return one log document by its MongoDB _id."""
    log = await LogDAO.get_log_by_id(log_id)
    if not log:
        raise HTTPException(status_code=404, detail="Log not found")
    return log


@router.get("/", response_model=List[LogEntry], summary="Get logs with optional filters")
async def get_logs(
    agent_id: Optional[str] = None,
    channel:  Optional[str] = None,
    level:    Optional[str] = None,
    skip: int = Query(0,  ge=0,  description="Number of logs to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum logs to return"),
):
    """
    Return logs.
    If any filter is supplied we call DAO filter‑method, otherwise we list all.
    """
    if agent_id or channel or level:
        return await LogDAO.get_logs_by_filter(agent_id, channel, level, skip, limit)
    return await LogDAO.get_all_logs(skip, limit)

# ──────────── Post ───────────────────────────────────────────────────────

@router.post("/", response_model=str, status_code=201, summary="Create a single log entry (manual)")
async def create_log(log: LogEntry):
    """Manually insert one log (mainly for testing)."""
    return await LogDAO.add_log(log)


@router.post("/ingest", status_code=201, summary="Ingest one log from a user agent")
async def ingest_one(log: LogEntry):
    """
    Endpoint hit by the **user agent** when it posts **one** event.

    *If the document already exists (duplicate _id) DAO will ignore and we still
    return HTTP 201 so the agent advances its cursor.*
    """
    try:
        await LogDAO.add_log(log)
        return {"status": "log stored (or duplicate ignored)"}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Ingestion failed: {exc}")


@router.post("/ingest/bulk", status_code=201, summary="Ingest many logs in a single request")
async def ingest_bulk(logs: List[LogEntry]):
    """
    Bulk version – let the agent send 100‑500 docs at once for better throughput.

    DAO method `add_logs_bulk()` should handle duplicates internally
    (e.g. unordered insert with `pymongo`).
    """
    if not logs:
        raise HTTPException(status_code=400, detail="Empty payload")

    try:
        inserted = await LogDAO.add_logs_bulk(logs)    # <-- implement in DAO
        return {"status": "bulk stored", "inserted": inserted}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Bulk ingestion failed: {exc}")

# ──────────── Put ────────────────────────────────────────────────────────

@router.put("/{log_id}", summary="Update selected fields of a log")
async def update_log(log_id: str, changes: LogUpdate):
    """
    Allow limited edits (alert flags, AI classification, etc.).
    """
    patch = changes.dict(exclude_unset=True, exclude_none=True)
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
