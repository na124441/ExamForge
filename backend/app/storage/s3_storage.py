import hashlib
from app.storage.storage_client import BaseStorageClient
from app.config import settings

class S3StorageClient(BaseStorageClient):
    """S3 bucket client using boto3 SDK."""
    def __init__(self):
        try:
            import boto3
            self.s3 = boto3.client(
                "s3",
                aws_access_key_id=settings.S3_ACCESS_KEY,
                aws_secret_access_key=settings.S3_SECRET_KEY,
                endpoint_url=settings.S3_ENDPOINT
            )
        except Exception as e:
            print(f"Boto3 / S3 initialization failed: {e}")
            self.s3 = None

    def put_object(self, bucket: str, key: str, data: bytes, content_type: str = None) -> dict:
        if not self.s3:
            raise RuntimeError("S3 client not initialized.")
        extra_args = {}
        if content_type:
            extra_args["ContentType"] = content_type
            
        self.s3.put_object(Bucket=bucket, Key=key, Body=data, **extra_args)
        sha256 = hashlib.sha256(data).hexdigest()
        return {
            "bucket": bucket,
            "key": key,
            "size": len(data),
            "sha256": sha256,
            "backend": "S3"
        }

    def get_object(self, bucket: str, key: str) -> bytes:
        if not self.s3:
            raise RuntimeError("S3 client not initialized.")
        resp = self.s3.get_object(Bucket=bucket, Key=key)
        return resp["Body"].read()

    def delete_object(self, bucket: str, key: str) -> bool:
        if not self.s3:
            return False
        self.s3.delete_object(Bucket=bucket, Key=key)
        return True

    def generate_presigned_url(self, bucket: str, key: str, expires_in: int = 600) -> str:
        if not self.s3:
            return ""
        return self.s3.generate_presigned_url(
            "get_object",
            Params={"Bucket": bucket, "Key": key},
            ExpiresIn=expires_in
        )
