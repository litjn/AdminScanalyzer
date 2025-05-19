import os, json, asyncio
from openai import AsyncOpenAI

# 1) read your key once
_OPENAI_KEY = os.getenv("OPENAI_API_KEY")         # ← put in .env
_client      = AsyncOpenAI(api_key=_OPENAI_KEY)

_MODEL       = os.getenv("OPENAI_MODEL", "gpt-4o-mini")  # easy to swap later

_PROMPT_SYS  = (
    "You are a senior SOC analyst. "
    "Given a Windows Event Log, reply with ONE short recommended action "
    "(max 25 words) that a security team should take. "
    "Reply ONLY with that sentence."
)

async def ask_openai(log_doc: dict) -> str | None:
    """Return a 1-sentence recommendation, or None on failure/time-out."""
    if not _OPENAI_KEY:
        return None                         # key missing → skip silently

    try:
        rsp = await _client.chat.completions.create(
            model=_MODEL,
            temperature=0.2,
            max_tokens=60,
            timeout=8,                      # seconds
            messages=[
                {"role": "system", "content": _PROMPT_SYS},
                {"role": "user",
                 "content": json.dumps(log_doc, indent=2, default=str)},
            ],
        )
        return rsp.choices[0].message.content.strip()
    except Exception:
        return None
