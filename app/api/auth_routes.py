"""
Auth routes
===========

• `POST /auth/register`  – create a new credential
• `POST /auth/login`     – verify e-mail / password
• `OPTIONS /auth/login`  – CORS pre-flight handler (204 No Content)
"""

from __future__ import annotations

from fastapi import APIRouter, HTTPException, Response, status

from app.dao.credential_dao import CredentialDAO
from app.models.credential_model import Credential, LoginRequest

router = APIRouter(prefix="/auth", tags=["Auth"])


# ────────────────────────────────────────────────────────────────────────
#  OPTIONS – explicit 204 for CORS pre-flight
# ────────────────────────────────────────────────────────────────────────
@router.options("/login", include_in_schema=False)
async def login_options() -> Response:  # noqa: D401
    """
    Respond to browser pre-flight with an empty 204 so JSON validation is
    never triggered on the body-less OPTIONS request.
    """
    return Response(status_code=status.HTTP_204_NO_CONTENT)


# ────────────────────────────────────────────────────────────────────────
#  POST /register
# ────────────────────────────────────────────────────────────────────────
@router.post(
    "/register",
    status_code=status.HTTP_201_CREATED,
    summary="Create a new credential (admin-only)",
    responses={409: {"description": "E-mail already exists"}},
)
async def register(cred: Credential):
    """Idempotent admin-only registration endpoint."""

    if await CredentialDAO.get_by_email(cred.email):
        raise HTTPException(409, detail="E-mail already exists")

    doc_id = await CredentialDAO.add(cred)
    return {"status": "created", "id": doc_id}


# ────────────────────────────────────────────────────────────────────────
#  POST /login
# ────────────────────────────────────────────────────────────────────────
@router.post(
    "/login",
    summary="Verify credentials (e-mail + password)",
    responses={401: {"description": "Invalid credentials"}},
)
async def login(req: LoginRequest):
    """Return **200 / {valid:true}** when creds match, else **401**."""

    if await CredentialDAO.verify(req.email, req.password):
        return {"valid": True}

    raise HTTPException(
        status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials"
    )
