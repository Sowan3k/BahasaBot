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


def _send_email_sync(to_email: str, reset_token: str) -> bool:
    """
    Synchronous helper that calls the Resend SDK.
    Runs inside asyncio.to_thread() so it does not block the event loop.
    """
    import resend  # lazy import — package must be installed but not imported at startup

    resend.api_key = RESEND_API_KEY

    reset_url = f"{FRONTEND_URL}/reset-password?token={reset_token}"

    html_body = f"""
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                max-width: 500px; margin: 0 auto; padding: 32px 24px;
                background: #ffffff; color: #1a1a1a;">
      <h2 style="margin: 0 0 8px; font-size: 22px; font-weight: 700;">
        Reset your BahasaBot password
      </h2>
      <p style="color: #555; font-size: 15px; margin: 0 0 24px;">
        Click the button below to choose a new password.
        This link expires in <strong>15 minutes</strong>.
      </p>
      <a href="{reset_url}"
         style="display: inline-block; background-color: #4a7c59; color: #ffffff;
                padding: 13px 28px; border-radius: 8px; text-decoration: none;
                font-weight: 600; font-size: 15px;">
        Reset Password
      </a>
      <p style="color: #888; font-size: 13px; margin: 24px 0 8px;">
        If the button doesn't work, copy this link into your browser:
      </p>
      <a href="{reset_url}"
         style="color: #4a7c59; font-size: 13px; word-break: break-all;">
        {reset_url}
      </a>
      <hr style="border: none; border-top: 1px solid #eee; margin: 28px 0;" />
      <p style="color: #aaa; font-size: 12px; margin: 0;">
        If you didn't request a password reset, you can safely ignore this email.
        Your password will not change.
      </p>
    </div>
    """

    params: resend.Emails.SendParams = {
        "from": f"BahasaBot <{RESEND_FROM_EMAIL}>",
        "to": [to_email],
        "subject": "Reset your BahasaBot password",
        "html": html_body,
    }

    response = resend.Emails.send(params)
    return bool(response and response.get("id"))


async def send_reset_email(to_email: str, reset_token: str) -> bool:
    """
    Send a password-reset link to *to_email* via Resend.

    The raw *reset_token* is embedded in the link; the hashed version is what
    gets stored in the DB.  Returns True on success, False on any failure.
    """
    if not RESEND_API_KEY:
        logger.error("RESEND_API_KEY not set — cannot send password-reset email")
        return False

    try:
        success = await asyncio.to_thread(_send_email_sync, to_email, reset_token)
        if success:
            logger.info("Password-reset email sent", to=to_email)
        else:
            logger.warning("Resend returned no ID for reset email", to=to_email)
        return success
    except Exception as exc:
        logger.error("Failed to send password-reset email", to=to_email, error=str(exc))
        return False
