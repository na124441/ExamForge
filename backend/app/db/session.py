from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.config import settings

connect_args = {}
engine_kwargs = {}

# SQLite needs check_same_thread set to False for multi-threaded FastAPI handlers
if settings.DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}
else:
    # PostgreSQL specific pool configurations
    connect_args = {
        "keepalives": 1,
        "keepalives_idle": 30,
        "keepalives_interval": 10,
        "keepalives_count": 5
    }
    engine_kwargs = {
        "pool_size": 10,
        "max_overflow": 20
    }

engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    pool_pre_ping=True,  # Connection health ping check before checkout
    **engine_kwargs
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
