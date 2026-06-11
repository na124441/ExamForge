from app.storage.s3_storage import S3StorageClient

class MinIOStorageClient(S3StorageClient):
    """MinIO uses standard S3 protocol, inherits all S3 client operations."""
    pass
