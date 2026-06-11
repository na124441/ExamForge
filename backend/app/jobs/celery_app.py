import os
from celery import Celery
from app.config import settings

# Initialize Celery Application instance
celery_app = Celery(
    "examforge",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL
)

# Check if running in development or testing without Redis running
# We will dynamically check if we are in fallback mode
from app.cache.redis_client import is_redis_degraded

# Configure settings
celery_app.conf.update(
    task_always_eager=True,  # Inline task execution
    task_ignore_result=False,
    result_expires=3600,
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"]
)
