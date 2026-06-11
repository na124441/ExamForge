import os
import hmac
import hashlib
import time
from app.storage.storage_client import BaseStorageClient
from app.config import settings

class LocalStorageClient(BaseStorageClient):
    """Local filesystem storage client with presigned URL HMAC signatures."""
    def __init__(self):
        # Create base storage folder inside workspace
        self.root_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "storage_data"))
        os.makedirs(self.root_path, exist_ok=True)

    def put_object(self, bucket: str, key: str, data: bytes, content_type: str = None) -> dict:
        file_path = os.path.join(self.root_path, bucket, key.replace("/", os.sep))
        os.makedirs(os.path.dirname(file_path), exist_ok=True)
        with open(file_path, "wb") as f:
            f.write(data)
        
        # Calculate SHA-256 hash
        sha256 = hashlib.sha256(data).hexdigest()
        return {
            "bucket": bucket,
            "key": key,
            "size": len(data),
            "sha256": sha256,
            "backend": "LOCAL"
        }

    def get_object(self, bucket: str, key: str) -> bytes:
        file_path = os.path.join(self.root_path, bucket, key.replace("/", os.sep))
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"Object {bucket}/{key} not found.")
        with open(file_path, "rb") as f:
            return f.read()

    def delete_object(self, bucket: str, key: str) -> bool:
        file_path = os.path.join(self.root_path, bucket, key.replace("/", os.sep))
        if os.path.exists(file_path):
            os.remove(file_path)
            return True
        return False

    def generate_presigned_url(self, bucket: str, key: str, expires_in: int = 600) -> str:
        expires = int(time.time()) + expires_in
        # Generate signature using application secret key
        msg = f"{bucket}:{key}:{expires}".encode("utf-8")
        sig = hmac.new(settings.SECRET_KEY.encode("utf-8"), msg, hashlib.sha256).hexdigest()
        
        # Return local download URL
        return f"http://localhost:8000/api/storage/download?bucket={bucket}&key={key}&expires={expires}&signature={sig}"
