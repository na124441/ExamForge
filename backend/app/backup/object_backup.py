import hashlib
import json
from sqlalchemy import text
from app.db.session import SessionLocal

def create_object_manifest_snapshot(institution_id: str) -> str:
    """Aggregates all StorageObject records for a tenant and generates an integrity hash."""
    db = SessionLocal()
    try:
        res = db.execute(
            text("SELECT object_key, sha256_hash FROM storage_objects WHERE institution_id = :inst_id"),
            {"inst_id": institution_id}
        ).fetchall()
        
        manifest = {r[0]: r[1] for r in res}
        serialized = json.dumps(manifest, sort_keys=True)
        return hashlib.sha256(serialized.encode("utf-8")).hexdigest()
    except Exception as e:
        print(f"Object manifest snapshot error: {e}")
        return hashlib.sha256(b"empty").hexdigest()
    finally:
        db.close()
