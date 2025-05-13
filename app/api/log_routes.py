# app/api/log_routes.py
# -------------------------------------------------------------------------
#  Scanalyzer ‑ Admin side – Log api
#  (No API‑Key handling yet – add later if you like)
# -------------------------------------------------------------------------
from typing import List, Optional

from fastapi import APIRouter, HTTPException, Query, Header
from pydantic.v1 import ValidationError

from app.dao.log_dao        import LogDAO

from app.models.full_log import FullLogEntry
from app.models.log_model   import LogEntry
from app.models.log_update_model import LogUpdate
from app.services.log_processor import LogProcessor

router = APIRouter(prefix="/logs", tags=["Logs"])

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



# --- Custom API for the NEW Functionality, I should have stored the original code before operating like this, but it is what it is
@router.post("/ingest", status_code=202)
async def ingest_log(log: LogEntry):
    """
    Endpoint to ingest a single log entry, validate it, enrich it, and save it to the database.
    """
    try:
        # Step 1: Validate the raw log sent by the user using LogEntry
        raw_log = log.model_dump(by_alias=True)  # Converts LogEntry instance into a dictionary

        # Step 2: Enrich the log using the LogProcessor
        enriched_log_data = await LogProcessor.process(raw_log)

        # Step 3: Validate the enriched log using FullLogEntry
        final_log = FullLogEntry(**enriched_log_data)

        # Step 4: Save the enriched and validated log to the database
        saved_id = await LogDAO.add_log(final_log)

        if saved_id is None:
            # Duplicate log, but ingestion should still return 202
            return {"status": "log stored (or duplicate ignored)"}

    except ValidationError as exc:
        # Handle validation errors from Pydantic models
        raise HTTPException(status_code=400, detail=f"Validation Error: {exc}")

    except Exception as exc:
        # Handle any unknown or unexpected errors
        raise HTTPException(status_code=500, detail=f"Processing Error: {exc}")

    return {"status": "log stored"}




"""

@router.post("/ingest", status_code=201, summary="Ingest one log from a user agent")
async def ingest_one(log: LogEntry, x_api_key: str = Header(...)):
   
    #Endpoint hit by the **user agent** when it posts **one** event.

    #*If the document already exists (duplicate _id) DAO will ignore and we still
    #return HTTP 201 so the agent advances its cursor.*
    
    try:

        await LogDAO.add_log(log)
        return {"status": "log stored (or duplicate ignored)"}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Ingestion failed: {exc}")
"""
import asyncio

@router.post("/ingest/bulk", status_code=201, summary="Ingest many logs in a single request")
async def ingest_bulk(logs: List[LogEntry]):
    """
    Bulk version – let the agent send 100‑500 docs at once for better throughput.
    Each log is validated, enriched, and saved in bulk to the database.
    """
    if not logs:
        raise HTTPException(status_code=400, detail="Empty payload")

    try:
        # Step 1: Convert LogEntry objects to dictionaries
        raw_logs = [log.model_dump(by_alias=True) for log in logs]

        # Step 2: Process each log asynchronously
        enriched_logs = await asyncio.gather(
            *(LogProcessor.process(log) for log in raw_logs)  # Concurrent processing
        )

        # Step 3: Validate each enriched log using FullLogEntry
        validated_logs = []
        for enriched_log in enriched_logs:
            try:
                validated_logs.append(FullLogEntry(**enriched_log))
            except ValidationError as exc:
                raise HTTPException(
                    status_code=400,
                    detail=f"Validation Error in one of the logs: {exc}",
                )

        # Step 4: Save validated logs to the database using DAO
        inserted = await LogDAO.add_logs_bulk(validated_logs)

        return {"status": "bulk stored", "inserted": inserted}

    except ValidationError as exc:
        raise HTTPException(status_code=400, detail=f"Validation Error: {exc}")
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Bulk ingestion failed: {exc}")








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