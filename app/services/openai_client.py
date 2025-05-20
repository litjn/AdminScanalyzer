# ────────────────────────────────────────────────────────────────────────
# 🔹 app/services/openai_client.py
# ────────────────────────────────────────────────────────────────────────

"""Central wrapper around OpenAI ChatCompletion for classification & advice."""
from __future__ import annotations

import json, os
from typing import Any, Dict, Literal

import backoff
from openai import AsyncOpenAI, OpenAI
from dotenv import load_dotenv

load_dotenv()

_API_KEY = os.getenv("OPENAI_API_KEY") or ""
MODEL_CLASSIFY = os.getenv("OPENAI_CLASSIFY_MODEL", "gpt-4o-mini")
MODEL_ADVICE   = os.getenv("OPENAI_ADVICE_MODEL",   "gpt-4o-mini")

if not _API_KEY:
    raise RuntimeError("OPENAI_API_KEY missing – set in .env")

_client_async = AsyncOpenAI(api_key=_API_KEY)
_client_sync  = OpenAI(api_key=_API_KEY)

_CLASS_LABEL = Literal["normal", "suspicious", "anomaly", "critical"]

_PROMPT_CLASSIFY = """
You are a cybersecurity log analyst.

Label definitions
• normal      → expected routine admin/user activity during business hours
• suspicious  → failed logons, brute‑force bursts, policy misconfigs
• anomaly     → rare or obfuscated use of privileged subsystems
• critical    → confirmed compromise: audit log cleared, LSASS dump, AV off

Return ONLY valid JSON:
{ "classification": <one_of_above>, "description": "<≤25 words>" }
"""

_PROMPT_ADVICE = (
    "You are a senior SOC analyst. Given a Windows Event Log, reply with ONE "
    "short recommended action (max 25 words). Reply ONLY with that sentence."
)

# ───────── Classification (sync – called in to_thread) ──────────────────
@backoff.on_exception(backoff.expo, Exception, max_time=30)
def classify_log(log_dict: Dict[str, Any]) -> Dict[str, str]:
    safe_json = json.dumps(log_dict, default=str)
    rsp = _client_sync.chat.completions.create(
        model=MODEL_CLASSIFY,
        temperature=0,
        max_tokens=120,
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": _PROMPT_CLASSIFY},
            {"role": "user", "content": safe_json},
        ],
    )
    return json.loads(rsp.choices[0].message.content)

# ───────── Advice (async) ───────────────────────────────────────────────
async def ask_advice(log_doc: Dict[str, Any]) -> str | None:
    try:
        rsp = await _client_async.chat.completions.create(
            model=MODEL_ADVICE,
            temperature=0.2,
            max_tokens=60,
            timeout=10,
            messages=[
                {"role": "system", "content": _PROMPT_ADVICE},
                {"role": "user", "content": json.dumps(log_doc, default=str)},
            ],
        )
        return rsp.choices[0].message.content.strip()
    except Exception:
        return None

__all__ = ["classify_log", "ask_advice", "_CLASS_LABEL"]
