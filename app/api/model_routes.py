# ----------------------------------------------------------------------
#  /model – standalone endpoints for testing / monitoring the classifier
# ----------------------------------------------------------------------
from __future__ import annotations
import asyncio
from typing import List

from app.services.gpt_explainer import queue_explanation

from typing import Dict, Any
from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel

from app.services.openai_classifier import classify_log
from app.models.log_model import LogEntry

router = APIRouter(prefix="/model", tags=["Model"])

class ClassifyResponse(BaseModel):
    classification: str
    description:    str

@router.post("/classify", response_model=ClassifyResponse)
async def classify_endpoint(log: LogEntry):
    """
    Pure classifier endpoint – does **not** write to MongoDB.
    Handy for unit-testing or monitoring accuracy.
    """
    try:
        result = await asyncio.to_thread(classify_log, log.dict(by_alias=True))
        return result
    except Exception as exc:
        raise HTTPException(status_code=503, detail=str(exc))


@router.post("/classify/bulk", response_model=List[ClassifyResponse])
async def classify_bulk(logs: List[LogEntry]):
    """
    Classify up to a few hundred logs in one shot.
    Uses asyncio gather for throughput.
    """
    if not logs:
        raise HTTPException(status_code=400, detail="Empty payload")

    async def _one(lg):               # helper
        return await asyncio.to_thread(classify_log, lg.dict(by_alias=True))

    try:
        return await asyncio.gather(*(_one(l) for l in logs))
    except Exception as exc:
        raise HTTPException(status_code=503, detail=str(exc))


# app/api/gpt_routes.py


router = APIRouter(prefix="/gpt")

class ExplainRequest(BaseModel):
    log: Dict[str, Any]

@router.post("/explain", status_code=202)
async def explain_log(req: ExplainRequest, bg: BackgroundTasks):
    bg.add_task(queue_explanation, req.log)     # fire-and-forget
    return {"detail": "Log sent to GPT; you’ll get the answer shortly."}
