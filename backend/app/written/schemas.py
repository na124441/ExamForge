from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class BookletCreateRequest(BaseModel):
    candidate_id: str
    exam_id: str
    total_pages: int
    center_id: str

class PageUploadRequest(BaseModel):
    page_number: int
    image_url: str
    page_hash: str

class WrittenPageResponse(BaseModel):
    id: str
    booklet_id: str
    page_number: int
    image_url: Optional[str]
    page_hash: str
    upload_status: str
    created_at: datetime

    class Config:
        from_attributes = True

class WrittenBookletResponse(BaseModel):
    id: str
    exam_id: str
    candidate_id: str
    anonymous_id: str
    center_id: str
    total_pages: int
    booklet_hash: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True
