from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from app.database import get_db
import app.models as models

router = APIRouter(prefix="/api/vendors", tags=["vendors"])

class VendorRegisterRequest(BaseModel):
    name: str
    legal_name: str
    registration_number: str
    email: str
    google_oauth_key: Optional[str] = None
    dlt_sms_key: Optional[str] = None
    payment_upi_id: Optional[str] = None
    payment_bank_name: Optional[str] = None
    payment_account_number: Optional[str] = None
    payment_ifsc_code: Optional[str] = None

@router.get("")
def list_vendors(db: Session = Depends(get_db)):
    vendors = db.query(models.VendorOrganization).all()
    return vendors

@router.post("")
def create_vendor(request: VendorRegisterRequest, db: Session = Depends(get_db)):
    existing = db.query(models.VendorOrganization).filter(
        models.VendorOrganization.registration_number == request.registration_number
    ).first()
    if existing:
        return existing

    tenant_slug = request.name.lower().replace(" ", "-")
    vendor = models.VendorOrganization(
        name=request.name,
        legal_name=request.legal_name,
        registration_number=request.registration_number,
        tenant_slug=tenant_slug,
        email=request.email,
        google_oauth_key=request.google_oauth_key,
        dlt_sms_key=request.dlt_sms_key,
        payment_upi_id=request.payment_upi_id,
        payment_bank_name=request.payment_bank_name,
        payment_account_number=request.payment_account_number,
        payment_ifsc_code=request.payment_ifsc_code,
        status="APPROVED"
    )
    db.add(vendor)
    db.commit()
    db.refresh(vendor)
    return vendor
