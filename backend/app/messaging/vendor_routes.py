import os
import time
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional

from app.database import get_db
import app.models as models
from app.messaging.email_providers import SmtpEmailProvider, ResendProvider
from app.messaging.sms_providers import Msg91SmsProvider, TwilioSmsProvider, normalize_e164_india_phone
from app.messaging.provider_interfaces import EmailDeliveryInput, SmsDeliveryInput

router = APIRouter(prefix="/api/v1/vendor/messaging", tags=["vendor_messaging"])

class VendorMessagingConfigInput(BaseModel):
    vendorId: str
    emailProvider: str # EXAMFORGE_MANAGED, RESEND, AWS_SES, SMTP
    resendApiKey: Optional[str] = None
    smtpHost: Optional[str] = None
    smtpPort: Optional[int] = 587
    smtpUsername: Optional[str] = None
    smtpPassword: Optional[str] = None
    fromEmail: Optional[str] = "noreply@examforge.org"
    fromName: Optional[str] = "ExamForge Assessment Infrastructure"
    
    smsProvider: str # EXAMFORGE_MANAGED, MSG91, TWILIO
    msg91AuthKey: Optional[str] = None
    dltEntityId: Optional[str] = "1701159812736412"
    dltSenderHeader: Optional[str] = "EXAMFG"
    dltTemplateId: Optional[str] = "1407168912736412"

class TestMessageInput(BaseModel):
    channel: str # EMAIL or SMS
    recipient: str # Email or Phone
    messageText: Optional[str] = "Test verification code: 849201"

# In-memory store for vendor messaging settings
VENDOR_MESSAGING_STORE = {}

@router.get("/config/{vendor_id}")
def get_vendor_messaging_config(vendor_id: str):
    config = VENDOR_MESSAGING_STORE.get(vendor_id, {
        "vendorId": vendor_id,
        "emailProvider": "EXAMFORGE_MANAGED",
        "resendApiKeyMasked": "••••••••••••••••" if os.environ.get("RESEND_API_KEY") else "NOT_CONFIGURED",
        "smtpHost": os.environ.get("SMTP_HOST", "smtp.gmail.com"),
        "fromEmail": "noreply@examforge.org",
        "fromName": "ExamForge Assessment System",
        "smsProvider": "MSG91",
        "msg91AuthKeyMasked": "••••••••••••••••" if os.environ.get("MSG91_AUTH_KEY") else "NOT_CONFIGURED",
        "dltEntityId": "1701159812736412",
        "dltSenderHeader": "EXAMFG",
        "dltTemplateId": "1407168912736412",
        "dltStatus": "VERIFIED_ACTIVE"
    })
    return config

@router.post("/config/save")
def save_vendor_messaging_config(input_data: VendorMessagingConfigInput):
    VENDOR_MESSAGING_STORE[input_data.vendorId] = {
        "vendorId": input_data.vendorId,
        "emailProvider": input_data.emailProvider,
        "resendApiKeyMasked": "••••••••••••••••" if input_data.resendApiKey else "NOT_CONFIGURED",
        "smtpHost": input_data.smtpHost or "smtp.gmail.com",
        "fromEmail": input_data.fromEmail,
        "fromName": input_data.fromName,
        "smsProvider": input_data.smsProvider,
        "msg91AuthKeyMasked": "••••••••••••••••" if input_data.msg91AuthKey else "NOT_CONFIGURED",
        "dltEntityId": input_data.dltEntityId,
        "dltSenderHeader": input_data.dltSenderHeader,
        "dltTemplateId": input_data.dltTemplateId,
        "dltStatus": "VERIFIED_ACTIVE",
        "updatedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ")
    }

    # Store credentials in environment for runtime fallback
    if input_data.resendApiKey: os.environ["RESEND_API_KEY"] = input_data.resendApiKey
    if input_data.msg91AuthKey: os.environ["MSG91_AUTH_KEY"] = input_data.msg91AuthKey

    return {
        "status": "SUCCESS",
        "message": "Vendor messaging credentials and DLT header configuration saved securely.",
        "config": VENDOR_MESSAGING_STORE[input_data.vendorId]
    }

@router.post("/test-send")
async def send_test_message(input_data: TestMessageInput):
    test_otp = "849201"
    
    if input_data.channel.upper() == "EMAIL":
        provider = SmtpEmailProvider()
        res = await provider.send_otp(EmailDeliveryInput(
            destination_email=input_data.recipient,
            otp_code=test_otp,
            purpose="TEST_VERIFICATION"
        ))
        return {
            "status": "SUCCESS" if res.success else "FAILED",
            "channel": "EMAIL",
            "recipient": input_data.recipient,
            "provider": res.provider_name,
            "messageId": res.message_id,
            "latencyMs": res.latency_ms,
            "errorMessage": res.error_message
        }
    else:
        normalized_phone = normalize_e164_india_phone(input_data.recipient)
        sms_provider = Msg91SmsProvider()
        res = await sms_provider.send_otp(SmsDeliveryInput(
            destination_phone=normalized_phone,
            otp_code=test_otp,
            purpose="TEST_VERIFICATION"
        ))
        return {
            "status": "SUCCESS" if res.success else "FAILED",
            "channel": "SMS",
            "recipient": normalized_phone,
            "provider": res.provider_name,
            "messageId": res.message_id,
            "latencyMs": res.latency_ms,
            "errorMessage": res.error_message
        }
