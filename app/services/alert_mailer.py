"""
Builds a nice text e-mail out of a log record and fires it via utils.mailer
"""
import os, json, asyncio
from datetime import datetime
from typing import Dict, Any

from app.utils.mailer import send_mail, _build_html

ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "admin@example.com")
INCORPORATE_GPT = bool(int(os.getenv("ALERT_USE_OPENAI", "0")))

# -- OPTIONAL: one-liner wrapper around your existing openai_classifier ---
from app.services.openai_helper import ask_openai

async def dispatch_alert(log_doc: Dict[str, Any]) -> None:
    """
    Fire-and-forget caller – don’t block the ingestion path.
    """
    # Optional GPT suggestion
    suggestion = None
    if INCORPORATE_GPT and log_doc.get("ai_classification") in {"critical", "anomaly"}:
        try:
            suggestion = await ask_openai(log_doc)
        except Exception:
            # never blow up alerting because GPT is slow / down
            suggestion = None

    subject = f"[{log_doc['ai_classification'].upper()}] Scanalyzer alert – " \
              f"event {log_doc['event_id']}"

    plain = "\n".join([
        f"Time : {log_doc['timestamp']}",
        f"Host : {log_doc['event_host']}",
        f"User : {log_doc.get('user_sid', 'N/A')}",
        f"Desc : {log_doc.get('event_description', '')}",
        "",
        f"GPT suggestion: {suggestion or 'N/A'}",
        "",
        "Full log JSON ↓",
        json.dumps(log_doc, indent=2, default=str),
    ])

    html = _build_html(log_doc, suggestion)

    asyncio.create_task(send_mail(ADMIN_EMAIL, subject, plain, html))
