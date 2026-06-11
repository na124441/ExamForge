import uuid
import time
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from app.observability.metrics import metrics_registry

class RequestIDMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        """Middleware to trace requests, record execution metrics, and attach X-Request-ID headers."""
        request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
        request.state.request_id = request_id
        
        # Increment requests counter
        metrics_registry.increment("examforge_api_requests_total")
        
        start_time = time.time()
        try:
            response = await call_next(request)
        except Exception as e:
            # Re-raise to let other handlers capture, but make sure to track latency first
            metrics_registry.record_latency(time.time() - start_time)
            raise e
            
        process_time = time.time() - start_time
        metrics_registry.record_latency(process_time)
        
        # Append trace ID header to outbound response
        response.headers["X-Request-ID"] = request_id
        return response
