# app/services/gpt_explainer.py
import os, json, asyncio
from openai import AsyncOpenAI
from app.utils.mailer import send_mail            # reuse existing helper
from datetime import datetime

client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))
MODEL  = "o3"                                     # advanced reasoning

SYSTEM_PROMPT = """
You are a senior SOC analyst. 
Given a Windows Event Log, provide:
1. A plain-English summary of what happened.
2. Why it matters (impact / risk).
3. Recommended next steps (bulleted).
Use clear language a junior analyst understands.
Return JSON with keys:
summary, impact, actions
"""

async def _call_gpt(log_doc: dict) -> dict:
    resp = await client.chat.completions.create(
        model=MODEL,
        temperature=0.3,
        max_tokens=300,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user",
             "content": json.dumps(log_doc, indent=2, default=str)},
        ],
    )
    return json.loads(resp.choices[0].message.content)

async def queue_explanation(log_doc: dict):
    try:
        result = await _call_gpt(log_doc)
    except Exception as exc:
        result = {"summary": "GPT failed", "impact": str(exc), "actions": []}

    # ▸ Option A: e-mail the answer to the analyst
    subject = f"GPT explanation for event {log_doc['event_id']}"
    body = json.dumps(result, indent=2)
    await send_mail(os.getenv("ADMIN_EMAIL"), subject, body, None)

    # ▸ Option B: push to a “gpt_answers” collection or WebSocket
    # await gpt_answers_collection.insert_one({
    #     "req_id": log_doc["_id"],
    #     "answered_at": datetime.utcnow(),
    #     **result,
    # })
