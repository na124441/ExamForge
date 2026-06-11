import logging
import json
import time

class JSONFormatter(logging.Formatter):
    """Format log records as structured JSON logs."""
    def format(self, record):
        log_data = {
            "timestamp": self.formatTime(record, self.datefmt),
            "level": record.levelname,
            "message": record.getMessage(),
            "logger": record.name,
            "request_id": getattr(record, "request_id", None),
            "institution_id": getattr(record, "institution_id", None),
            "actor_id": getattr(record, "actor_id", None)
        }
        return json.dumps(log_data)

def setup_logging():
    """Setup root logger formatting settings."""
    logger = logging.getLogger()
    logger.setLevel(logging.INFO)
    
    # Check if handler already registered
    if not logger.handlers:
        handler = logging.StreamHandler()
        formatter = JSONFormatter()
        handler.setFormatter(formatter)
        logger.addHandler(handler)
