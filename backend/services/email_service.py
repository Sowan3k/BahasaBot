"""
Email Service — Resend integration

Handles sending transactional emails for the forgot-password flow.
Uses the Resend Python SDK (resend==2.6.0).

Environment variables required:
  RESEND_API_KEY      — Resend API key (starts with re_...)
  RESEND_FROM_EMAIL   — Sender address (e.g. onboarding@resend.dev for testing)
  FRONTEND_URL        — Base URL of the frontend (for building reset links)
"""

import asyncio
import os

from backend.utils.logger import get_logger

logger = get_logger(__name__)

RESEND_API_KEY = os.getenv("RESEND_API_KEY", "")
RESEND_FROM_EMAIL = os.getenv("RESEND_FROM_EMAIL", "onboarding@resend.dev")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")


def _send_code_email_sync(to_email: str, code: str) -> bool:
    """
    Synchronous helper that calls the Resend SDK.
    Runs inside asyncio.to_thread() so it does not block the event loop.
    Sends a 6-digit verification code (not a link).
    """
    import resend  # lazy import — package must be installed but not imported at startup

    resend.api_key = RESEND_API_KEY

    html_body = f"""
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                max-width: 500px; margin: 0 auto; padding: 32px 24px;
                background: #ffffff; color: #1a1a1a;">
      <h2 style="margin: 0 0 8px; font-size: 22px; font-weight: 700;">
        Reset your BahasaBot password
      </h2>
      <p style="color: #555; font-size: 15px; margin: 0 0 24px;">
        Enter the 6-digit code below to reset your password.
        This code expires in <strong>10 minutes</strong>.
      </p>

      <!-- Verification code box -->
      <div style="background: #f5f5f5; border: 1px solid #e0e0e0; border-radius: 12px;
                  padding: 24px; text-align: center; margin: 0 0 24px;">
        <p style="margin: 0 0 8px; color: #888; font-size: 13px; text-transform: uppercase;
                  letter-spacing: 0.08em;">Your verification code</p>
        <p style="margin: 0; font-size: 40px; font-weight: 800; letter-spacing: 0.25em;
                  color: #4a7c59; font-variant-numeric: tabular-nums;">{code}</p>
      </div>

      <p style="color: #888; font-size: 13px; margin: 0 0 4px;">
        Enter this code on the BahasaBot password-reset page within 10 minutes.
      </p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
      <p style="color: #aaa; font-size: 12px; margin: 0;">
        If you didn&apos;t request a password reset, you can safely ignore this email.
        Your password will not change.
      </p>
    </div>
    """

    params: resend.Emails.SendParams = {
        "from": f"BahasaBot <{RESEND_FROM_EMAIL}>",
        "to": [to_email],
        "subject": f"{code} is your BahasaBot verification code",
        "html": html_body,
    }

    response = resend.Emails.send(params)
    return bool(response and response.get("id"))


async def send_reset_email(to_email: str, code: str) -> bool:
    """
    Send a 6-digit password-reset verification code to *to_email* via Resend.

    The raw *code* is embedded in the email body.
    Returns True on success, False on any failure.
    """
    if not RESEND_API_KEY:
        logger.error("RESEND_API_KEY not set — cannot send password-reset email")
        return False

    try:
        success = await asyncio.to_thread(_send_code_email_sync, to_email, code)
        if success:
            logger.info("Password-reset code email sent", to=to_email)
        else:
            logger.warning("Resend returned no ID for reset code email", to=to_email)
        return success
    except Exception as exc:
        logger.error("Failed to send password-reset code email", to=to_email, error=str(exc))
        return False
