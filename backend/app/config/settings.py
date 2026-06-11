import os
from pydantic_settings import BaseSettings
from typing import List, Optional

class Settings(BaseSettings):
    # Core Database & Cache
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./examforge.db")
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    
    # Auth Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "examforge-super-secret-dev-key-12345")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    
    # Object Storage Configuration
    STORAGE_BACKEND: str = os.getenv("STORAGE_BACKEND", "LOCAL") # LOCAL, S3, MINIO
    S3_ENDPOINT: Optional[str] = os.getenv("S3_ENDPOINT", None)
    S3_ACCESS_KEY: Optional[str] = os.getenv("S3_ACCESS_KEY", None)
    S3_SECRET_KEY: Optional[str] = os.getenv("S3_SECRET_KEY", None)
    S3_BUCKET: str = os.getenv("S3_BUCKET", "examforge-assets")
    
    # System & Observability Options
    DEPLOYMENT_MODE: str = os.getenv("DEPLOYMENT_MODE", "SAAS") # SAAS, ON_PREMISE
    CORS_ORIGINS: str = os.getenv("CORS_ORIGINS", "*")
    RATE_LIMIT_ENABLED: bool = os.getenv("RATE_LIMIT_ENABLED", "True").lower() == "true"
    OBSERVABILITY_ENABLED: bool = os.getenv("OBSERVABILITY_ENABLED", "True").lower() == "true"
    BACKUP_ENABLED: bool = os.getenv("BACKUP_ENABLED", "True").lower() == "true"
    
    # Key Signing Security Mode
    SIGNING_KEY_MODE: str = os.getenv("SIGNING_KEY_MODE", "MOCK") # ECDSA, MOCK

    class Config:
        env_file = ".env"

settings = Settings()
