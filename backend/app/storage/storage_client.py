import abc
from app.config import settings

class BaseStorageClient(abc.ABC):
    @abc.abstractmethod
    def put_object(self, bucket: str, key: str, data: bytes, content_type: str = None) -> dict:
        """Upload object bytes to destination storage path."""
        pass

    @abc.abstractmethod
    def get_object(self, bucket: str, key: str) -> bytes:
        """Download object bytes from destination path."""
        pass

    @abc.abstractmethod
    def delete_object(self, bucket: str, key: str) -> bool:
        """Delete target object from path."""
        pass

    @abc.abstractmethod
    def generate_presigned_url(self, bucket: str, key: str, expires_in: int = 600) -> str:
        """Generate presigned HTTP GET download URL."""
        pass


_storage_client = None

def get_storage_client() -> BaseStorageClient:
    global _storage_client
    if _storage_client is not None:
        return _storage_client

    backend = settings.STORAGE_BACKEND.upper()
    if backend == "S3":
        from app.storage.s3_storage import S3StorageClient
        _storage_client = S3StorageClient()
    elif backend == "MINIO":
        from app.storage.minio_storage import MinIOStorageClient
        _storage_client = MinIOStorageClient()
    else:
        from app.storage.local_storage import LocalStorageClient
        _storage_client = LocalStorageClient()

    return _storage_client
