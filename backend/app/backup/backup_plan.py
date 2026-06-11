from typing import Dict, Any

def get_backup_metadata_template(institution_id: str) -> Dict[str, Any]:
    """Generates standard parameters for backup tasks."""
    return {
        "institution_id": institution_id,
        "backup_type": "FULL",
        "encryption_algorithm": "AES-256-GCM",
        "compress_format": "zip"
    }
