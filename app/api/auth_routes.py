from __future__ import annotations
from fastapi import APIRouter, HTTPException

from app.models.credential_model import Credential, LoginRequest
from app.dao.credential_dao import CredentialDAO

router = APIRouter(prefix="/auth", tags=["Auth"])

# ───────── Registration (admin-only) ───────────────────────────
@router.post("/register", status_code=201)
async def register(cred: Credential):
    """
    Create a new credential document.
    NOTE: Protect this route with proper auth in production.
    """
    existing = await CredentialDAO.get_by_email(cred.email)
    if existing:
        raise HTTPException(409, detail="E-mail already exists")

    _id = await CredentialDAO.add(cred)
    return {"status": "created", "id": _id}

# ───────── Login / verification ────────────────────────────────
@router.post("/login")
async def login(req: LoginRequest):
    """
    Returns {"valid": true} when e-mail *and* password match a doc
    in ScanalyzerDB.credentials. Otherwise 401.
    """
    if await CredentialDAO.verify(req.email, req.password):
        return {"valid": True}

    raise HTTPException(401, detail="Invalid credentials")
