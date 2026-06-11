import psycopg2
from sqlalchemy import text
from app.db.session import engine
from app.config import settings

def check_postgres_connection() -> bool:
    """Validate active PostgreSQL database connection. Returns True for SQLite fallback."""
    if settings.DATABASE_URL.startswith("sqlite"):
        return True
    
    try:
        # Perform low-level connection validation via SQLAlchemy engine
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return True
    except Exception as e:
        print(f"Postgres connection check failed: {e}")
        return False
