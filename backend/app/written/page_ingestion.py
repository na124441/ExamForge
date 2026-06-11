from sqlalchemy.orm import Session
from app.models import WrittenPage, WrittenBooklet
from typing import List

def validate_page_sequence(db: Session, booklet_id: str, new_page_number: int) -> bool:
    booklet = db.query(WrittenBooklet).filter(WrittenBooklet.id == booklet_id).first()
    if not booklet:
        return False
    if new_page_number < 1 or new_page_number > booklet.total_pages:
        return False
    return True

def detect_missing_pages(db: Session, booklet_id: str) -> List[int]:
    booklet = db.query(WrittenBooklet).filter(WrittenBooklet.id == booklet_id).first()
    if not booklet:
        return []
    uploaded = db.query(WrittenPage.page_number).filter(WrittenPage.booklet_id == booklet_id).all()
    uploaded_nums = {r[0] for r in uploaded}
    missing = []
    for i in range(1, booklet.total_pages + 1):
        if i not in uploaded_nums:
            missing.append(i)
    return missing
