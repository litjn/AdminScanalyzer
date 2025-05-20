# ────────────────────────────────────────────────────────────────────────
# 🔹 app/services/gpt_explainer.py
# ────────────────────────────────────────────────────────────────────────

"""Synchronous & async endpoints share this helper for log explanation."""
from __future__ import annotations

import json, os
from typing import Dict, Any

from openai import AsyncOpenAI
from app.utils.mailer import send_mail, build_html_explanation
from app.services.openai_client import _API_KEY

MODEL_EXPLAIN = os.getenv("OPENAI_EXPLAIN_MODEL", "gpt-4o-mini")
_client_exp   = AsyncOpenAI(api_key=_API_KEY)

_PROMPT_EXPLAIN = """
You are a senior SOC analyst.
Return JSON with keys:
• summary – one sentence
• impact  – why this matters
• actions – list of recommended next steps
"""

async def explain_log_gpt(log_doc: Dict[str, Any]) -> Dict[str, Any]:
    rsp = await _client_exp.chat.completions.create(
        model=MODEL_EXPLAIN,
        temperature=0.3,
        max_tokens=300,
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": _PROMPT_EXPLAIN},
            {"role": "user",   "content": json.dumps(log_doc, default=str)},
        ],
        timeout=15,
    )
    return json.loads(rsp.choices[0].message.content)

async def email_explanation(to_addr: str, log_doc: Dict[str, Any]):
    try:
        result = await explain_log_gpt(log_doc)
    except Exception as exc:
        result = {"summary": "GPT failed", "impact": str(exc), "actions": []}

    subj = f"GPT explanation for event {log_doc.get('event_id')}"
    plain = json.dumps(result, indent=2)
    html  = build_html_explanation(result)
    await send_mail(to_addr, subj, plain, html)

__all__ = ["explain_log_gpt", "email_explanation"]