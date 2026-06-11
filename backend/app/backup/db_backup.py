import hashlib
import json
from sqlalchemy import text
from app.db.session import SessionLocal

def create_db_snapshot() -> str:
    """Serializes core database states into a JSON string and computes its SHA256 checksum."""
    db = SessionLocal()
    try:
        tables = [
            "users", "questions", "generated_papers", "encrypted_packages",
            "candidates", "candidate_answer_events", "results", "exam_states",
            "institutions", "exam_centers", "disputes", "result_certificates"
        ]
        snapshot_data = {}
        for table in tables:
            try:
                # Query all records
                res = db.execute(text(f"SELECT * FROM {table}")).fetchall()
                snapshot_data[table] = [list(r) for r in res]
            except Exception:
                # Table might not exist yet
                snapshot_data[table] = []
        
        # Serialize to stable JSON format
        serialized = json.dumps(snapshot_data, sort_keys=True, default=str)
        # Compute SHA256
        return hashlib.sha256(serialized.encode("utf-8")).hexdigest()
    finally:
        db.close()
