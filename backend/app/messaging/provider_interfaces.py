from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
from pydantic import BaseModel

class EmailDeliveryInput(BaseModel):
    destination_email: str
    otp_code: str
    purpose: str
    sender_name: Optional[str] = "ExamForge Auth"
    vendor_id: Optional[str] = None

class EmailDeliveryResult(BaseModel):
    success: bool
    message_id: Optional[str] = None
    provider_name: str
    error_detail: Optional[str] = None
    latency_ms: float = 0.0

class SmsDeliveryInput(BaseModel):
    destination_phone: str # E.164 format: +919876543210
    otp_code: str
    purpose: str
    dlt_entity_id: Optional[str] = None
    dlt_template_id: Optional[str] = None
    sender_id: Optional[str] = "EXAMFG"
    vendor_id: Optional[str] = None

class SmsDeliveryResult(BaseModel):
    success: bool
    message_id: Optional[str] = None
    provider_name: str
    error_detail: Optional[str] = None
    latency_ms: float = 0.0

class EmailProvider(ABC):
    @abstractmethod
    async def send_otp(self, input_data: EmailDeliveryInput) -> EmailDeliveryResult:
        pass

class SmsProvider(ABC):
    @abstractmethod
    async def send_otp(self, input_data: SmsDeliveryInput) -> SmsDeliveryResult:
        pass
