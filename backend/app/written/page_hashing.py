from app.security import calculate_sha256
from typing import List

def hash_page_content(content: str) -> str:
    return calculate_sha256(content)

def compute_booklet_hash(page_hashes: List[str]) -> str:
    # Concatenate page hashes in order and generate booklet hash
    combined = "".join(page_hashes)
    return calculate_sha256(combined)
