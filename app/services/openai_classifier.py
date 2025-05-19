"""
Tiny wrapper around the OpenAI Chat Completions JSON-mode call.
"""
from __future__ import annotations
import json, os, backoff
from typing import Dict

import openai
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()
_CLIENT = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

_SYSTEM_PROMPT = """
You are a cybersecurity log analyst.

Label definitions
• normal      → expected admin/user activity during business hours
• suspicious  → failed logons, brute-force bursts, policy misconfigs
• anomaly     → rare or obfuscated use of privileged subsystems
• critical    → evidence of compromise: audit log cleared, AV disabled,
                LSASS dump, malicious toolkit (Mimikatz, CobaltStrike)

Return ONLY valid JSON:
{ "classification": <one_of_above>, "description": "<≤25 words>" }
"""

@backoff.on_exception(backoff.expo, Exception, max_time=30)
def classify_log(log_dict: Dict) -> Dict[str, str]:
    """
    Serialises dict safely (datetimes ⇒ iso-strings) and returns
    {"classification": "...", "description": "..."}.
    """
    safe_json = json.dumps(log_dict, default=str)        # ← fix here 🔥

    rsp = _CLIENT.chat.completions.create(
        model="gpt-4o-mini",
        response_format={ "type": "json_object" },
        temperature=0,
        max_tokens=120,
        messages=[
            {"role": "system", "content": _SYSTEM_PROMPT},
            {"role": "user",   "content": safe_json}
        ],
    )
    return json.loads(rsp.choices[0].message.content)



