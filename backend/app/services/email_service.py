import os
import smtplib
import ssl
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime
from typing import Tuple, Optional
from app.config import settings

logger = logging.getLogger("roadguard.email")
logger.setLevel(logging.INFO)

# In-memory storage for test/development inspection
_DEV_EMAIL_INBOX = []

def get_dev_email_inbox():
    """Returns recent sent emails during development/testing."""
    return _DEV_EMAIL_INBOX

def clear_dev_email_inbox():
    """Clears dev inbox."""
    global _DEV_EMAIL_INBOX
    _DEV_EMAIL_INBOX = []


def _create_html_envelope(title: str, preheader: str, body_content: str) -> str:
    """Generates a responsive modern dark-themed HTML email matching RoadGuard AI branding."""
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{title}</title>
  <style>
    body {{
      margin: 0;
      padding: 0;
      background-color: #0b0f19;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #e2e8f0;
      -webkit-font-smoothing: antialiased;
    }}
    .wrapper {{
      width: 100%;
      table-layout: fixed;
      background-color: #0b0f19;
      padding: 40px 0 60px 0;
    }}
    .container {{
      max-width: 560px;
      margin: 0 auto;
      background: #111827;
      border: 1px solid #1f2937;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5);
    }}
    .header {{
      padding: 32px 32px 24px 32px;
      text-align: center;
      background: linear-gradient(180deg, rgba(245, 158, 11, 0.08) 0%, rgba(17, 24, 39, 0) 100%);
      border-bottom: 1px solid #1f2937;
    }}
    .logo-badge {{
      display: inline-block;
      padding: 8px 16px;
      border-radius: 12px;
      background: rgba(245, 158, 11, 0.15);
      border: 1px solid rgba(245, 158, 11, 0.3);
      color: #f59e0b;
      font-weight: 800;
      font-size: 18px;
      letter-spacing: -0.5px;
    }}
    .logo-badge span {{
      color: #ffffff;
    }}
    .content {{
      padding: 32px;
    }}
    h1 {{
      margin: 0 0 16px 0;
      font-size: 22px;
      font-weight: 700;
      color: #f8fafc;
      letter-spacing: -0.3px;
    }}
    p {{
      margin: 0 0 16px 0;
      font-size: 15px;
      line-height: 24px;
      color: #94a3b8;
    }}
    .otp-box {{
      margin: 28px 0;
      padding: 24px;
      text-align: center;
      background: #0f172a;
      border: 1px dashed rgba(245, 158, 11, 0.4);
      border-radius: 12px;
    }}
    .otp-code {{
      font-family: 'Courier New', Courier, monospace;
      font-size: 38px;
      font-weight: 800;
      letter-spacing: 8px;
      color: #fbbf24;
      text-shadow: 0 0 12px rgba(245, 158, 11, 0.3);
      margin: 4px 0;
    }}
    .otp-meta {{
      margin-top: 10px;
      font-size: 13px;
      color: #cbd5e1;
    }}
    .btn {{
      display: inline-block;
      padding: 14px 28px;
      font-size: 15px;
      font-weight: 700;
      color: #0b0f19 !important;
      background: #f59e0b;
      background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
      text-decoration: none;
      border-radius: 10px;
      box-shadow: 0 4px 14px rgba(245, 158, 11, 0.4);
      margin: 20px 0;
    }}
    .alert-box {{
      margin-top: 24px;
      padding: 14px 18px;
      background: rgba(30, 41, 59, 0.7);
      border-left: 3px solid #f59e0b;
      border-radius: 6px;
      font-size: 13px;
      line-height: 20px;
      color: #94a3b8;
    }}
    .footer {{
      padding: 24px 32px;
      text-align: center;
      background: #0b0f19;
      border-top: 1px solid #1f2937;
      font-size: 12px;
      color: #64748b;
      line-height: 18px;
    }}
    .footer a {{
      color: #94a3b8;
      text-decoration: underline;
    }}
  </style>
</head>
<body>
  <div style="display:none;font-size:1px;color:#333;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">
    {preheader}
  </div>
  <table class="wrapper" width="100%" cellpadding="0" cellspacing="0" role="presentation">
    <tr>
      <td align="center">
        <table class="container" width="100%" cellpadding="0" cellspacing="0" role="presentation">
          <tr>
            <td class="header">
              <div class="logo-badge">RoadGuard <span>AI</span></div>
              <p style="margin: 8px 0 0 0; font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 600;">
                Civil Infrastructure Intelligence
              </p>
            </td>
          </tr>
          <tr>
            <td class="content">
              {body_content}
            </td>
          </tr>
          <tr>
            <td class="footer">
              <p style="margin:0 0 8px 0; color:#64748b; font-size:12px;">This is an automated security communication from RoadGuard AI.</p>
              <p style="margin:0; color:#475569; font-size:11px;">&copy; {datetime.utcnow().year} RoadGuard AI Infrastructure Portal. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
"""


def send_email(to_email: str, subject: str, html_body: str, plain_text_body: str) -> Tuple[bool, str]:
    """
    Sends an email using configured SMTP settings.
    Falls back gracefully and reliably records delivery in dev mode if credentials are unset.
    Returns (success: bool, message: str).
    """
    to_email = to_email.strip().lower()
    from_email = settings.SMTP_FROM_EMAIL
    from_name = settings.SMTP_FROM_NAME

    # Store in memory for development inspection & verification
    delivery_record = {
        "to": to_email,
        "subject": subject,
        "html": html_body,
        "text": plain_text_body,
        "timestamp": datetime.utcnow().isoformat(),
        "delivered_via": "smtp" if settings.SMTP_USER and settings.SMTP_PASSWORD else "development_mock"
    }
    _DEV_EMAIL_INBOX.append(delivery_record)

    # Check if SMTP credentials are configured
    if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        logger.info(
            f"[EMAIL DEV MODE] SMTP credentials not fully configured (SMTP_USER/SMTP_PASSWORD empty). "
            f"Simulated successful delivery to: {to_email} | Subject: '{subject}'"
        )
        return True, "Email queued/delivered via development mode."

    # Send over actual SMTP
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"{from_name} <{from_email}>"
        msg["To"] = to_email
        msg["Date"] = datetime.utcnow().strftime("%a, %d %b %Y %H:%M:%S +0000")

        # Attach text and html versions
        msg.attach(MIMEText(plain_text_body, "plain", "utf-8"))
        msg.attach(MIMEText(html_body, "html", "utf-8"))

        if settings.SMTP_SSL or settings.SMTP_PORT == 465:
            context = ssl.create_default_context()
            with smtplib.SMTP_SSL(settings.SMTP_HOST, settings.SMTP_PORT, context=context, timeout=15) as server:
                server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                server.sendmail(from_email, [to_email], msg.as_string())
        else:
            with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=15) as server:
                server.ehlo()
                if settings.SMTP_TLS:
                    context = ssl.create_default_context()
                    server.starttls(context=context)
                    server.ehlo()
                server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                server.sendmail(from_email, [to_email], msg.as_string())

        logger.info(f"Successfully sent live email via SMTP to {to_email}")
        return True, "Email successfully delivered via SMTP."

    except smtplib.SMTPAuthenticationError as e:
        err_msg = f"SMTP Authentication failed: {str(e)}"
        logger.error(err_msg)
        return False, err_msg
    except smtplib.SMTPConnectError as e:
        err_msg = f"Could not connect to SMTP server {settings.SMTP_HOST}:{settings.SMTP_PORT}: {str(e)}"
        logger.error(err_msg)
        return False, err_msg
    except Exception as e:
        err_msg = f"Failed to deliver email: {str(e)}"
        logger.error(err_msg)
        return False, err_msg


def send_verification_otp_email(to_email: str, full_name: str, otp_code: str, expiry_minutes: int = 5) -> Tuple[bool, str]:
    """Sends OTP verification email for account activation."""
    subject = f"{otp_code} is your RoadGuard AI verification code"
    preheader = f"Your one-time email verification code is {otp_code}. Valid for {expiry_minutes} minutes."

    body_content = f"""
      <h1>Verify Your Email Address</h1>
      <p>Hello <strong>{full_name or 'Citizen'}</strong>,</p>
      <p>Thank you for registering with <strong>RoadGuard AI</strong>. To activate your account and start reporting road hazards, please enter the following verification code:</p>
      
      <div class="otp-box">
        <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #94a3b8; margin-bottom: 6px;">One-Time Verification Code</div>
        <div class="otp-code">{otp_code}</div>
        <div class="otp-meta">⏱️ Expires in <strong>{expiry_minutes} minutes</strong></div>
      </div>

      <div class="alert-box">
        <strong>Security Notice:</strong> Never share this code with anyone. RoadGuard AI administrators or field engineers will never ask you for your verification code. If you did not create an account, please disregard this email.
      </div>
    """

    plain_text = f"""
Hello {full_name or 'Citizen'},

Thank you for registering with RoadGuard AI.
Your verification code is: {otp_code}

This code will expire in {expiry_minutes} minutes.
Never share this code with anyone. If you did not request this, please ignore this message.

— RoadGuard AI Team
    """.strip()

    html = _create_html_envelope(subject, preheader, body_content)
    return send_email(to_email, subject, html, plain_text)


def send_password_reset_email(to_email: str, full_name: str, reset_token: str, reset_code: str, expiry_minutes: int = 15) -> Tuple[bool, str]:
    """Sends password reset link and code."""
    subject = "Reset Your RoadGuard AI Password"
    preheader = f"Use code {reset_code} or click the link to reset your password. Valid for {expiry_minutes} minutes."
    
    reset_url = f"{settings.FRONTEND_URL}/reset-password?token={reset_token}&email={to_email}"

    body_content = f"""
      <h1>Password Reset Request</h1>
      <p>Hello <strong>{full_name or 'User'}</strong>,</p>
      <p>We received a request to reset the password for your RoadGuard AI account associated with <code>{to_email}</code>.</p>
      
      <div style="text-align: center; margin: 24px 0;">
        <a href="{reset_url}" class="btn" target="_blank" rel="noopener noreferrer">Reset Your Password</a>
      </div>

      <p style="text-align: center; font-size: 13px; color: #64748b;">Or enter this 6-digit reset code manually on the reset page:</p>

      <div class="otp-box" style="margin-top: 12px; padding: 18px;">
        <div class="otp-code" style="font-size: 32px;">{reset_code}</div>
        <div class="otp-meta">⏱️ Valid for <strong>{expiry_minutes} minutes</strong></div>
      </div>

      <div class="alert-box">
        <strong>Did not request this?</strong> If you did not make this request, your account is safe and you can safely ignore this email. Your password will remain unchanged.
      </div>
      
      <p style="margin-top: 20px; font-size: 12px; color: #64748b; word-break: break-all;">
        Direct link: <a href="{reset_url}" style="color: #f59e0b;">{reset_url}</a>
      </p>
    """

    plain_text = f"""
Hello {full_name or 'User'},

We received a request to reset your RoadGuard AI password.
Reset link: {reset_url}
Manual 6-digit Code: {reset_code}

This link and code will expire in {expiry_minutes} minutes.
If you did not request this, please disregard this email.

— RoadGuard AI Security
    """.strip()

    html = _create_html_envelope(subject, preheader, body_content)
    return send_email(to_email, subject, html, plain_text)


def send_password_changed_notification(to_email: str, full_name: str) -> Tuple[bool, str]:
    """Sends notification confirming password change."""
    subject = "Security Alert: Your RoadGuard AI Password Was Changed"
    preheader = "Your account password was recently updated."

    body_content = f"""
      <h1>Password Changed Successfully</h1>
      <p>Hello <strong>{full_name or 'User'}</strong>,</p>
      <p>The password for your RoadGuard AI account (<code>{to_email}</code>) was successfully updated on <strong>{datetime.utcnow().strftime('%B %d, %Y at %H:%M UTC')}</strong>.</p>
      
      <div class="alert-box" style="border-left-color: #10b981; background: rgba(16, 185, 129, 0.1);">
        <strong style="color: #34d399;">All sessions refreshed:</strong> All active sessions and refresh tokens have been updated for security. You can now log in using your new password.
      </div>

      <p style="margin-top: 20px; font-size: 13px; color: #94a3b8;">
        If you did NOT make this change, please immediately contact your administrator or reply to this notice to secure your account.
      </p>
    """

    plain_text = f"""
Hello {full_name or 'User'},

Your RoadGuard AI password was changed on {datetime.utcnow().strftime('%B %d, %Y at %H:%M UTC')}.
All prior active sessions have been invalidated.
If you did not perform this change, please contact support immediately.

— RoadGuard AI Security Team
    """.strip()

    html = _create_html_envelope(subject, preheader, body_content)
    return send_email(to_email, subject, html, plain_text)
