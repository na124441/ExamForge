from app.db.session import SessionLocal
from app.models import BackupManifest

def verify_backup_manifest(backup_id: str) -> bool:
    """Validate that the backup manifest checksums are structurally intact."""
    db = SessionLocal()
    try:
        manifest = db.query(BackupManifest).filter(BackupManifest.id == backup_id).first()
        if not manifest:
            return False
            
        # Ensure it has hash values and is completed
        if manifest.db_snapshot_hash and manifest.object_manifest_hash and manifest.status == "COMPLETED":
            return True
            
        return False
    except Exception:
        return False
    finally:
        db.close()
