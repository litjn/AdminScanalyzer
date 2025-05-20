# ────────────────────────────────────────────────────────────────────────
# 🔹 app/services/alert_mailer.py
# ────────────────────────────────────────────────────────────────────────

"""Send alert e‑mails with pretty HTML + optional GPT advice."""
from __future__ import annotations

import asyncio, json, os
from typing import Dict, Any

from app.utils.mailer import send_mail, build_html_alert
from .openai_client import ask_advice, _CLASS_LABEL

ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "admin@example.com")
INCORP_GPT  = bool(int(os.getenv("ALERT_USE_OPENAI", "0")))


async def dispatch_alert(log_doc: Dict[str, Any]) -> None:
    """Non‑blocking call – schedules the real send via `asyncio.create_task`."""
    suggestion: str | None = None
    if INCORP_GPT and log_doc.get("ai_classification") in {"critical", "anomaly"}:
        suggestion = await ask_advice(log_doc)

    subject = (
        f"[{log_doc['ai_classification'].upper()}] Scanalyzer alert – "
        f"event {log_doc['event_id']}"
    )

    plain = "\n".join([
        f"Time : {log_doc['timestamp']}",
        f"Host : {log_doc['event_host']}",
        f"User : {log_doc.get('user_sid', 'N/A')}",
        f"Desc : {log_doc.get('event_description', '')}",
        "", f"GPT suggestion: {suggestion or 'N/A'}",
        "", "Full log JSON ↓",
        json.dumps(log_doc, indent=2, default=str),
    ])

    html = build_html_alert(log_doc, suggestion)
    asyncio.create_task(send_mail(ADMIN_EMAIL, subject, plain, html))

__all__ = ["dispatch_alert"]

