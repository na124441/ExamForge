from contextlib import contextmanager
from app.db.session import SessionLocal

@contextmanager
def transaction_scope():
    """Context manager for transaction-safe SQLAlchemy database sessions."""
    db = SessionLocal()
    try:
        yield db
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"Transaction rolled back due to error: {e}")
        raise e
    finally:
        db.close()
