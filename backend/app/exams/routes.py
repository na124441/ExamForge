import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.database import get_db
import app.models as models

router = APIRouter(prefix="/api/v1/exams", tags=["examinations"])

class ExamCatalogResponse(BaseModel):
    id: str
    vendor_id: str
    vendor_name: Optional[str] = None
    code: str
    title: str
    purpose: str
    category: str
    academic_cycle: str
    exam_date: str
    exam_mode: str
    duration_minutes: int
    total_marks: float
    total_questions: int
    negative_marking: str
    fee_general: float
    fee_reserved: float
    eligibility_min_qualification: str
    eligibility_min_percentage: float
    eligibility_age_limit: Optional[str] = None
    eligibility_subjects_required: Optional[str] = None
    syllabus_summary: Optional[str] = None
    shifts: List[str] = []
    status: str

class EligibilityCheckRequest(BaseModel):
    exam_id: str
    qualification_level: str
    percentage_cgpa: str
    dob: Optional[str] = None
    category: Optional[str] = "General"

class EligibilityCheckResponse(BaseModel):
    is_eligible: bool
    status: str # "ELIGIBLE", "INELIGIBLE", "CHECK_PREREQUISITES"
    reasons: List[str] = []
    applicable_fee: float

@router.get("", response_model=List[ExamCatalogResponse])
def list_exam_catalogs(
    vendor_id: Optional[str] = Query(None, description="Filter exams by vendor ID"),
    category: Optional[str] = Query(None, description="Filter exams by category"),
    db: Session = Depends(get_db)
):
    """
    Fetches all active examinations from the database.
    Can be filtered by vendor_id or category.
    """
    query = db.query(models.ExamCatalog)
    if vendor_id and isinstance(vendor_id, str):
        query = query.filter(models.ExamCatalog.vendor_id == vendor_id)
    if category and isinstance(category, str):
        query = query.filter(models.ExamCatalog.category == category)

    exams = query.all()

    # Join vendor names
    vendor_ids = {e.vendor_id for e in exams}
    vendors = db.query(models.VendorOrganization).filter(models.VendorOrganization.id.in_(vendor_ids)).all()
    vendor_map = {v.id: v.name for v in vendors}

    res = []
    for e in exams:
        shifts = []
        if e.shifts_json:
            try:
                shifts = json.loads(e.shifts_json)
            except Exception:
                shifts = [e.shifts_json]

        res.append(ExamCatalogResponse(
            id=e.id,
            vendor_id=e.vendor_id,
            vendor_name=vendor_map.get(e.vendor_id, "Authorized Examination Vendor"),
            code=e.code,
            title=e.title,
            purpose=e.purpose,
            category=e.category,
            academic_cycle=e.academic_cycle,
            exam_date=e.exam_date,
            exam_mode=e.exam_mode,
            duration_minutes=e.duration_minutes,
            total_marks=e.total_marks,
            total_questions=e.total_questions,
            negative_marking=e.negative_marking or "+4 for correct, -1 for incorrect",
            fee_general=e.fee_general,
            fee_reserved=e.fee_reserved,
            eligibility_min_qualification=e.eligibility_min_qualification,
            eligibility_min_percentage=e.eligibility_min_percentage,
            eligibility_age_limit=e.eligibility_age_limit,
            eligibility_subjects_required=e.eligibility_subjects_required,
            syllabus_summary=e.syllabus_summary,
            shifts=shifts,
            status=e.status
        ))
    return res

@router.get("/{exam_id}", response_model=ExamCatalogResponse)
def get_exam_catalog_details(exam_id: str, db: Session = Depends(get_db)):
    """Fetches comprehensive details for a specific examination from the database."""
    exam = db.query(models.ExamCatalog).filter(models.ExamCatalog.id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Examination not found in database catalog.")

    vendor = db.query(models.VendorOrganization).filter(models.VendorOrganization.id == exam.vendor_id).first()

    shifts = []
    if exam.shifts_json:
        try:
            shifts = json.loads(exam.shifts_json)
        except Exception:
            shifts = [exam.shifts_json]

    return ExamCatalogResponse(
        id=exam.id,
        vendor_id=exam.vendor_id,
        vendor_name=vendor.name if vendor else "Authorized Examination Authority",
        code=exam.code,
        title=exam.title,
        purpose=exam.purpose,
        category=exam.category,
        academic_cycle=exam.academic_cycle,
        exam_date=exam.exam_date,
        exam_mode=exam.exam_mode,
        duration_minutes=exam.duration_minutes,
        total_marks=exam.total_marks,
        total_questions=exam.total_questions,
        negative_marking=exam.negative_marking or "+4 for correct, -1 for incorrect",
        fee_general=exam.fee_general,
        fee_reserved=exam.fee_reserved,
        eligibility_min_qualification=exam.eligibility_min_qualification,
        eligibility_min_percentage=exam.eligibility_min_percentage,
        eligibility_age_limit=exam.eligibility_age_limit,
        eligibility_subjects_required=exam.eligibility_subjects_required,
        syllabus_summary=exam.syllabus_summary,
        shifts=shifts,
        status=exam.status
    )

@router.post("/validate-eligibility", response_model=EligibilityCheckResponse)
def validate_candidate_eligibility(
    req: EligibilityCheckRequest,
    db: Session = Depends(get_db)
):
    """
    Validates candidate's educational qualification against the examination criteria in DB.
    """
    exam = db.query(models.ExamCatalog).filter(models.ExamCatalog.id == req.exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Examination not found.")

    reasons = []
    qual_hierarchy = {
        "Class 10": 10,
        "Class 12": 12,
        "Diploma": 13,
        "Undergraduate": 15,
        "Postgraduate": 17
    }

    cand_level = qual_hierarchy.get(req.qualification_level, 0)
    req_level = qual_hierarchy.get(exam.eligibility_min_qualification, 0)

    if cand_level < req_level:
        reasons.append(f"Minimum qualification required is {exam.eligibility_min_qualification}, but candidate provided {req.qualification_level}.")

    # Parse candidate percentage / CGPA
    import re
    pct_match = re.findall(r"(\d+(?:\.\d+)?)", req.percentage_cgpa or "")
    if pct_match:
        val = float(pct_match[0])
        # If CGPA (<= 10), convert to approximate percentage
        if val <= 10.0:
            val = val * 9.5
        if val < exam.eligibility_min_percentage:
            reasons.append(f"Minimum percentage required is {exam.eligibility_min_percentage}%, but candidate aggregate is ~{round(val, 1)}%.")

    is_reserved = req.category and req.category.upper() in ["OBC-NCL", "SC", "ST", "EWS", "PWD"]
    fee = exam.fee_reserved if is_reserved else exam.fee_general

    is_eligible = (len(reasons) == 0)

    return EligibilityCheckResponse(
        is_eligible=is_eligible,
        status="ELIGIBLE" if is_eligible else "INELIGIBLE",
        reasons=reasons,
        applicable_fee=fee
    )
