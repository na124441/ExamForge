import os
import sys
from app.config.settings import settings

def validate_production_config():
    """Verify that crucial production env vars exist when running in production."""
    # Check if we are simulating production or running on real server
    is_prod = os.getenv("ENV", "development").lower() in ["production", "prod"]
    
    if is_prod:
        errors = []
        if settings.SECRET_KEY == "examforge-super-secret-dev-key-12345":
            errors.append("SECRET_KEY must be changed from the default value in production.")
        
        if settings.DATABASE_URL.startswith("sqlite"):
            errors.append("PostgreSQL database is required in production. SQLite is not allowed.")
            
        if settings.STORAGE_BACKEND in ["S3", "MINIO"]:
            if not settings.S3_ACCESS_KEY or not settings.S3_SECRET_KEY:
                errors.append("S3/MinIO access keys are missing while STORAGE_BACKEND is configured.")
                
        if errors:
            print("=== CONFIGURATION VALIDATION FAILED ===", file=sys.stderr)
            for err in errors:
                print(f"ERROR: {err}", file=sys.stderr)
            # Raise error to block startup
            raise ValueError(f"Production configuration validation failed: {'; '.join(errors)}")
            
    return True
