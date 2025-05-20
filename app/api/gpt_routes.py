# ────────────────────────────────────────────────────────────────────────
#  GPT routes (app/api/gpt_routes.py)
# ────────────────────────────────────────────────────────────────────────
import os
from fastapi import Query

from typing import Any, Dict, List

from fastapi import APIRouter, BackgroundTasks, HTTPException, status
from pydantic import BaseModel, Field, EmailStr

from app.services.gpt_explainer import (
    explain_log_gpt as call_gpt,
    email_explanation as queue_explanation, email_explanation,
)

DEFAULT_EMAIL = os.getenv("ADMIN_EMAIL")        # <- optional fallback


router_gpt = APIRouter(prefix="/gpt", tags=["GPT"])


class ExplainOut(BaseModel):
    summary: str = Field(..., example="DCOM warning indicates …")
    impact: str = Field(..., example="Potential misconfiguration …")
    actions: List[str] = Field(..., example=["Review DCOM ACL", "…"])


@router_gpt.post(
    "/explain",
    response_model=ExplainOut,
    summary="Synchronous GPT explanation (waits for result)",
    responses={502: {"description": "Upstream GPT error"}},
)
async def explain_now(log: Dict[str, Any]) -> ExplainOut:  # noqa: D401
    """Block until GPT returns a structured explanation."""

    try:
        return await call_gpt(log)
    except Exception as exc:
        raise HTTPException(status.HTTP_502_BAD_GATEWAY,
                            detail=f"GPT error: {exc}") from exc


@router_gpt.post(
    "/explain/async",
    status_code=status.HTTP_202_ACCEPTED,
    summary="Queue GPT explanation; result delivered via e‑mail",
)
async def explain_async(
        log: Dict[str, Any],
        bg: BackgroundTasks,
        to: EmailStr | None = Query(
            default= None,
            description="Address that will receive the explaination; falls back to "
            "EXPLAIN_DEFAULT_EMAIL env var if omitted",
        ),
):
    """Fire‑and‑forget – ideal for bulk uploads."""

    to_addr = to or DEFAULT_EMAIL
    if not to_addr:  # no address anywhere ⇒ 422
        raise HTTPException(
            status_code=422,
            detail="Provide ?to=user@example.com or set EXPLAIN_DEFAULT_EMAIL",
        )

    bg.add_task(email_explanation, to_addr, log)  # pass 2 args in right order
    return {"detail": f"Queued – explanation will be sent to {to_addr}."}

