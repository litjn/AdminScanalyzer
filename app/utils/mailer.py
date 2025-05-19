import os, aiosmtplib, json, html
from email.message import EmailMessage
from datetime import datetime

SMTP_HOST = os.getenv("SMTP_HOST",  "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER")
SMTP_PASS = os.getenv("SMTP_PASS")


def _build_html(log_doc: dict, suggestion: str | None) -> str:
    sev  = log_doc.get("ai_classification", "unknown")
    clr  = {"critical": "#e74c3c", "anomaly": "#e67e22",
            "suspicious": "#f1c40f", "normal": "#2ecc71"}.get(sev, "#95a5a6")

    # escape everything that might contain <>&
    esc  = lambda s: html.escape(str(s))
    rows = "".join(
        f"<tr><th>{k}</th><td>{esc(v)}</td></tr>"
        for k, v in [
            ("Time",      esc(log_doc['timestamp'])),
            ("Host",      log_doc.get('event_host')),
            ("Event ID",  log_doc['event_id']),
            ("User SID",  log_doc.get('user_sid', 'N/A')),
            ("Desc",      log_doc.get('event_description', '')),
            ("GPT hint",  suggestion or "—"),
        ]
    )

    prettified_json = html.escape(json.dumps(log_doc, indent=2, default=str))

    return f"""
    <html>
    <body style="font-family:Segoe UI,Helvetica,Arial,sans-serif;
                 background:#fafafa;padding:1rem 0;">
      <center>
      <table style="max-width:640px;width:90%;background:#fff;
                    border:1px solid #ddd;border-radius:6px;padding:0 24px;">
        <tr>
          <td style="padding:24px 0 10px 0;">
            <h2 style="margin:0;
                       color:{clr};text-transform:uppercase;">{sev}</h2>
            <p style="margin:4px 0 20px 0;font-size:14px;
                      color:#555;">Scanalyzer Alert &nbsp;•&nbsp;
                      {datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC")}</p>
          </td>
        </tr>
        <tr><td>
          <table style="width:100%;font-size:14px;border-collapse:collapse;">
            {rows}
          </table>
        </td></tr>
        <tr><td style="padding:16px 0 24px 0;">
          <pre style="background:#f6f8fa;border:1px solid #eee;
                       border-radius:4px;padding:12px;font-size:12px;
                       overflow-x:auto;">{prettified_json}</pre>
        </td></tr>
      </table>
      </center>
    </body>
    </html>
    """


async def send_mail(to_addr: str, subject: str,
                    plain_body: str, html_body: str | None = None) -> None:
    msg = EmailMessage()
    msg["From"] = SMTP_USER
    msg["To"]   = to_addr
    msg["Subject"] = subject

    # 1) plain-text part
    msg.set_content(plain_body)

    # 2) HTML alternative (most clients will render this)
    if html_body:
        msg.add_alternative(html_body, subtype="html")

    await aiosmtplib.send(
        msg,
        hostname=SMTP_HOST,
        port=SMTP_PORT,
        start_tls=True,
        username=SMTP_USER,
        password=SMTP_PASS,
    )
