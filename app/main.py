"""
FastAPI bootstrap
=================
"""

from __future__ import annotations

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Routers
from app.api.auth_routes import router as auth_router
from app.api.log_routes import router_logs
from app.api.stream_routes import router_stream
from app.api.gpt_routes import router_gpt

app = FastAPI(
    title="Scanalyzer API",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ─── CORS ───────────────────────────────────────────────────────────────
origins = ["http://localhost:5173", "*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],                 # include OPTIONS
    allow_headers=["*"],                 # include Content-Type
)

# ─── Routers ────────────────────────────────────────────────────────────
app.include_router(router_logs)
app.include_router(auth_router)
app.include_router(router_stream)
app.include_router(router_gpt)

# ─── Health probe ───────────────────────────────────────────────────────
@app.get("/", tags=["Meta"])
async def root() -> dict[str, str]:
    return {"message": "Scanalyzer FastAPI server running!"}
