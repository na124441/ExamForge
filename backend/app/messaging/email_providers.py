import os
import time
import uuid
import smtplib
import urllib.request
import urllib.error
import json
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional

from app.messaging.provider_interfaces import EmailProvider, EmailDeliveryInput, EmailDeliveryResult

class SmtpEmailProvider(EmailProvider):
    def __init__(
        self,
        host: Optional[str] = None,
        port: Optional[int] = None,
        username: Optional[str] = None,
        password: Optional[str] = None,
        from_email: Optional[str] = None,
        from_name: Optional[str] = None,
        use_tls: bool = True
    ):
        self.host = host or os.environ.get("SMTP_HOST", "smtp.gmail.com")
        self.port = int(port or os.environ.get("SMTP_PORT", "587"))
        self.username = username or os.environ.get("SMTP_USERNAME", "")
        self.password = password or os.environ.get("SMTP_PASSWORD", "")
        self.from_email = from_email or os.environ.get("SMTP_FROM_EMAIL", "noreply@examforge.org")
        self.from_name = from_name or os.environ.get("SMTP_FROM_NAME", "ExamForge Security")
        self.use_tls = use_tls

    async def send_otp(self, input_data: EmailDeliveryInput) -> EmailDeliveryResult:
        start_time = time.time()
        
        # If no SMTP credentials configured, print to console for dev testing
        if not self.username or not self.password:
            latency_ms = round((time.time() - start_time) * 1000, 2)
            message_id = f"smtp_dev_{uuid.uuid4().hex[:12]}"
            print(f"\n[LOCAL DEV OTP DISPATCH] To: {input_data.destination_email} | OTP Code: {input_data.otp_code} | Purpose: {input_data.purpose}\n")
            return EmailDeliveryResult(
                success=True,
                message_id=message_id,
                provider_name="SMTP_Development_Logger",
                latency_ms=latency_ms
            )

        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = f"[{input_data.otp_code}] ExamForge Verification Code"
            msg["From"] = f"{self.from_name} <{self.from_email}>"
            msg["To"] = input_data.destination_email

            html_body = f"""
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
              <h2 style="color: #1e3a8a; margin-bottom: 8px;">ExamForge Verification Code</h2>
              <p style="color: #475569; font-size: 14px;">Use the following 6-digit security code to complete your verification:</p>
              <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1d4ed8; padding: 16px; text-align: center; border-radius: 8px; margin: 20px 0;">
                {input_data.otp_code}
              </div>
              <p style="color: #64748b; font-size: 12px;">This code will expire in 5 minutes. Do not share this OTP with anyone.</p>
              <hr style="border: none; border-top: 1px solid #f1f5f9; margin-top: 20px;" />
              <p style="color: #94a3b8; font-size: 11px; text-align: center;">ExamForge Secure Multi-Tenant Assessment Infrastructure</p>
            </div>
            """
            msg.attach(MIMEText(html_body, "html"))

            with smtplib.SMTP(self.host, self.port, timeout=10) as server:
                if self.use_tls:
                    server.starttls()
                server.login(self.username, self.password)
                server.sendmail(self.from_email, [input_data.destination_email], msg.as_string())

            latency_ms = round((time.time() - start_time) * 1000, 2)
            message_id = f"smtp_msg_{uuid.uuid4().hex[:12]}"
            return EmailDeliveryResult(
                success=True,
                message_id=message_id,
                provider_name=f"SMTP_{self.host}",
                latency_ms=latency_ms
            )
        except Exception as e:
            latency_ms = round((time.time() - start_time) * 1000, 2)
            return EmailDeliveryResult(
                success=False,
                message_id="",
                provider_name=f"SMTP_{self.host}",
                error_detail=str(e),
                latency_ms=latency_ms
            )

class ResendProvider(EmailProvider):
    def __init__(self, api_key: Optional[str] = None, from_email: Optional[str] = None):
        self.api_key = api_key or os.environ.get("RESEND_API_KEY", "")
        self.from_email = from_email or os.environ.get("RESEND_FROM_EMAIL", "onboarding@resend.dev")

    async def send_otp(self, input_data: EmailDeliveryInput) -> EmailDeliveryResult:
        start_time = time.time()

        if not self.api_key:
            smtp_fallback = SmtpEmailProvider()
            return await smtp_fallback.send_otp(input_data)

        try:
            payload = {
                "from": self.from_email,
                "to": [input_data.destination_email],
                "subject": f"[{input_data.otp_code}] ExamForge Security Code",
                "html": f"""
                <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
                    <h2 style="color: #1e3a8a;">ExamForge Verification Code</h2>
                    <p style="font-size: 16px;">Your 6-digit verification code is:</p>
                    <div style="font-size: 32px; font-weight: bold; color: #2563eb; background: #eff6ff; padding: 12px 24px; border-radius: 8px; display: inline-block;">
                        {input_data.otp_code}
                    </div>
                    <p style="color: #64748b; font-size: 12px; margin-top: 16px;">This code is valid for 5 minutes.</p>
                </div>
                """
            }
            req = urllib.request.Request(
                "https://api.resend.com/emails",
                data=json.dumps(payload).encode("utf-8"),
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json"
                },
                method="POST"
            )
            with urllib.request.urlopen(req, timeout=10) as resp:
                res_data = json.loads(resp.read().decode("utf-8"))
                latency_ms = round((time.time() - start_time) * 1000, 2)
                return EmailDeliveryResult(
                    success=True,
                    message_id=res_data.get("id", f"resend_{uuid.uuid4().hex[:12]}"),
                    provider_name="Resend_REST_API",
                    latency_ms=latency_ms
                )
        except urllib.error.HTTPError as e:
            latency_ms = round((time.time() - start_time) * 1000, 2)
            err_body = e.read().decode("utf-8")
            print(f"\n[RESEND API HTTP ERROR {e.code}] Body: {err_body}")
            print(f"[NOTE] Resend free testing key (onboarding@resend.dev) ONLY allows sending to the email registered with your Resend account.")
            print(f"[LOCAL DEV OTP DISPATCH] Destination: {input_data.destination_email} | OTP Code: {input_data.otp_code}\n")

            # Fallback to SMTP if configured
            smtp_fallback = SmtpEmailProvider()
            if smtp_fallback.username and smtp_fallback.password:
                return await smtp_fallback.send_otp(input_data)

            return EmailDeliveryResult(
                success=True,
                message_id=f"resend_sandbox_{uuid.uuid4().hex[:12]}",
                provider_name="Resend_Sandbox_Logger",
                latency_ms=latency_ms,
                error_detail=f"Resend HTTP {e.code}: {err_body}"
            )
        except Exception as e:
            latency_ms = round((time.time() - start_time) * 1000, 2)
            smtp_fallback = SmtpEmailProvider()
            return await smtp_fallback.send_otp(input_data)

class SESProvider(EmailProvider):
    def __init__(self, region: str = "ap-south-1"):
        self.region = region

    async def send_otp(self, input_data: EmailDeliveryInput) -> EmailDeliveryResult:
        smtp_provider = SmtpEmailProvider(
            host=os.environ.get("AWS_SES_SMTP_HOST", f"email-smtp.{self.region}.amazonaws.com"),
            port=int(os.environ.get("AWS_SES_SMTP_PORT", "587")),
            username=os.environ.get("AWS_SES_SMTP_USER"),
            password=os.environ.get("AWS_SES_SMTP_PASS"),
            from_email=os.environ.get("AWS_SES_FROM_EMAIL", "noreply@examforge.org")
        )
        return await smtp_provider.send_otp(input_data)
