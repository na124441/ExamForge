import time
from contextlib import contextmanager
from app.observability.metrics import metrics_registry

@contextmanager
def trace_latency():
    """Timer context manager to record operational latencies."""
    start = time.time()
    try:
        yield
    finally:
        end = time.time()
        metrics_registry.record_latency(end - start)
