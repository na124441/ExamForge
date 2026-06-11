from app.db.postgres import check_postgres_connection
from app.db.migrations import check_migrations_current

def check_db_health() -> str:
    """Return DB health status: OK, DEGRADED, or UNHEALTHY."""
    if not check_postgres_connection():
        return "UNHEALTHY"
    if not check_migrations_current():
        return "DEGRADED"
    return "OK"
