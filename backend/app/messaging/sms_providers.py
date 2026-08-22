import os
import time
import uuid
import re
import urllib.request
import urllib.parse
import json
from typing import Optional

from app.messaging.provider_interfaces import SmsProvider, SmsDeliveryInput, SmsDeliveryResult

def normalize_e164_india_phone(phone: str) -> str:
    """
    Normalizes any Indian mobile phone representation to strict E.164 format:
    Example: '9876543210', '09876543210', '+91 98765 43210' -> '+919876543210'
    """
    digits = re.sub(r"\D", "", phone)
    if len(digits) == 10:
        return f"+91{digits}"
    elif len(digits) == 12 and digits.startswith("91"):
        return f"+{digits}"
    elif len(digits) == 11 and digits.startswith("0"):
        return f"+91{digits[1:]}"
    elif phone.startswith("+"):
        return f"+{digits}"
    return f"+91{digits[-10:]}"

class Fast2SmsProvider(SmsProvider):
    """
    Fast2SMS Quick OTP Gateway Integration for Indian Mobile Numbers.
    Docs: https://www.fast2sms.com/docs
    """
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.environ.get("FAST2SMS_API_KEY", "")

    async def send_otp(self, input_data: SmsDeliveryInput) -> SmsDeliveryResult:
        start_time = time.time()
        normalized_phone = normalize_e164_india_phone(input_data.destination_phone)
        mobile_10_digit = normalized_phone.replace("+91", "").replace("+", "")

        if not self.api_key:
            msg91 = Msg91SmsProvider()
            return await msg91.send_otp(input_data)

        try:
            url = "https://www.fast2sms.com/dev/bulkV2"
            payload = {
                "variables_values": input_data.otp_code,
                "route": "otp",
                "numbers": mobile_10_digit
            }
            req = urllib.request.Request(
                url,
                data=json.dumps(payload).encode("utf-8"),
                headers={
                    "authorization": self.api_key,
                    "Content-Type": "application/json"
                },
                method="POST"
            )
            with urllib.request.urlopen(req, timeout=10) as resp:
                res_data = json.loads(resp.read().decode("utf-8"))
                latency_ms = round((time.time() - start_time) * 1000, 2)
                return SmsDeliveryResult(
                    success=res_data.get("return") == True,
                    message_id=str(res_data.get("request_id", uuid.uuid4().hex[:12])),
                    provider_name="Fast2SMS_OTP_Gateway",
                    latency_ms=latency_ms
                )
        except Exception as e:
            latency_ms = round((time.time() - start_time) * 1000, 2)
            return SmsDeliveryResult(
                success=False,
                message_id="",
                provider_name="Fast2SMS_OTP_Gateway",
                error_detail=str(e),
                latency_ms=latency_ms
            )

class Msg91SmsProvider(SmsProvider):
    """
    Real MSG91 OTP Service API Integration.
    Docs: https://docs.msg91.com/otp
    Requires: authkey, template_id (DLT approved), sender (DLT approved Header ID e.g., 'EXAMFG').
    """
    def __init__(
        self,
        auth_key: Optional[str] = None,
        template_id: Optional[str] = None,
        sender_header: Optional[str] = None
    ):
        self.auth_key = auth_key or os.environ.get("MSG91_AUTH_KEY", "")
        self.template_id = template_id or os.environ.get("MSG91_TEMPLATE_ID", "649123891273")
        self.sender_header = sender_header or os.environ.get("MSG91_SENDER_ID", "EXAMFG")

    async def send_otp(self, input_data: SmsDeliveryInput) -> SmsDeliveryResult:
        start_time = time.time()
        normalized_phone = normalize_e164_india_phone(input_data.destination_phone)
        mobile_10_digit = normalized_phone.replace("+91", "").replace("+", "")

        if not self.auth_key:
            # Server console log for local dev when no live SMS gateway key present
            latency_ms = round((time.time() - start_time) * 1000, 2)
            message_id = f"msg91_dev_{uuid.uuid4().hex[:12]}"
            print(f"\n[LOCAL DEV SMS DISPATCH] To: {normalized_phone} | OTP Code: {input_data.otp_code} | DLT Header: {self.sender_header}\n")
            return SmsDeliveryResult(
                success=True,
                message_id=message_id,
                provider_name="MSG91_Development_Logger",
                latency_ms=latency_ms
            )

        try:
            url = f"https://control.msg91.com/api/v5/otp?template_id={self.template_id}&mobile=91{mobile_10_digit}&otp={input_data.otp_code}"
            headers = {
                "authkey": self.auth_key,
                "Content-Type": "application/json"
            }
            req = urllib.request.Request(url, headers=headers, method="POST")
            with urllib.request.urlopen(req, timeout=10) as resp:
                res_data = json.loads(resp.read().decode("utf-8"))
                latency_ms = round((time.time() - start_time) * 1000, 2)
                return SmsDeliveryResult(
                    success=res_data.get("type") == "success" or resp.status == 200,
                    message_id=res_data.get("request_id", f"msg91_{uuid.uuid4().hex[:12]}"),
                    provider_name="MSG91_OTP_v5_Gateway",
                    latency_ms=latency_ms
                )
        except Exception as e:
            latency_ms = round((time.time() - start_time) * 1000, 2)
            return SmsDeliveryResult(
                success=False,
                message_id="",
                provider_name="MSG91_OTP_v5_Gateway",
                error_detail=str(e),
                latency_ms=latency_ms
            )

class IndiaDltSmsProvider(SmsProvider):
    """
    Generic TRAI/DLT Compliant Telecom SMS Provider (Default ExamForge Managed SMS).
    """
    def __init__(self, sender_header: str = "EXAMFG", default_entity_id: str = "1701159812736412"):
        self.sender_header = sender_header
        self.default_entity_id = default_entity_id
        self.msg91 = Msg91SmsProvider()
        self.fast2sms = Fast2SmsProvider()

    async def send_otp(self, input_data: SmsDeliveryInput) -> SmsDeliveryResult:
        if os.environ.get("FAST2SMS_API_KEY"):
            return await self.fast2sms.send_otp(input_data)
        return await self.msg91.send_otp(input_data)

class TwilioSmsProvider(SmsProvider):
    """
    Twilio Programmable SMS / Verify API Provider.
    """
    def __init__(
        self,
        account_sid: Optional[str] = None,
        auth_token: Optional[str] = None,
        from_number: Optional[str] = None
    ):
        self.account_sid = account_sid or os.environ.get("TWILIO_ACCOUNT_SID", "")
        self.auth_token = auth_token or os.environ.get("TWILIO_AUTH_TOKEN", "")
        self.from_number = from_number or os.environ.get("TWILIO_FROM_NUMBER", "+18005550199")

    async def send_otp(self, input_data: SmsDeliveryInput) -> SmsDeliveryResult:
        start_time = time.time()
        normalized_phone = normalize_e164_india_phone(input_data.destination_phone)

        if not self.account_sid or not self.auth_token:
            msg91_fallback = Msg91SmsProvider()
            return await msg91_fallback.send_otp(input_data)

        try:
            url = f"https://api.twilio.com/2010-04-01/Accounts/{self.account_sid}/Messages.json"
            data = urllib.parse.urlencode({
                "To": normalized_phone,
                "From": self.from_number,
                "Body": f"ExamForge security verification code: {input_data.otp_code}. Valid for 5 minutes."
            }).encode("utf-8")

            import base64
            auth_str = base64.b64encode(f"{self.account_sid}:{self.auth_token}".encode("utf-8")).decode("utf-8")
            headers = {
                "Authorization": f"Basic {auth_str}",
                "Content-Type": "application/x-www-form-urlencoded"
            }

            req = urllib.request.Request(url, data=data, headers=headers, method="POST")
            with urllib.request.urlopen(req, timeout=10) as resp:
                res_data = json.loads(resp.read().decode("utf-8"))
                latency_ms = round((time.time() - start_time) * 1000, 2)
                return SmsDeliveryResult(
                    success=resp.status in (200, 201),
                    message_id=res_data.get("sid", f"twilio_{uuid.uuid4().hex[:12]}"),
                    provider_name="Twilio_SMS_REST",
                    latency_ms=latency_ms
                )
        except Exception as e:
            latency_ms = round((time.time() - start_time) * 1000, 2)
            return SmsDeliveryResult(
                success=False,
                message_id="",
                provider_name="Twilio_SMS_REST",
                error_detail=str(e),
                latency_ms=latency_ms
            )
