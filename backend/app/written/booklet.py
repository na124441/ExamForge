from sqlalchemy.orm import Session
from app.models import WrittenBooklet, WrittenPage
from app.written.page_hashing import compute_booklet_hash

def finalize_booklet_hashing(db: Session, booklet_id: str) -> str:
    pages = db.query(WrittenPage).filter(WrittenPage.booklet_id == booklet_id).order_by(WrittenPage.page_number).all()
    page_hashes = [p.page_hash for p in pages if p.page_hash]
    
    booklet_hash = compute_booklet_hash(page_hashes)
    booklet = db.query(WrittenBooklet).filter(WrittenBooklet.id == booklet_id).first()
    if booklet:
        booklet.booklet_hash = booklet_hash
        booklet.status = "LOCKED"
        db.commit()
        db.refresh(booklet)
    return booklet_hash
