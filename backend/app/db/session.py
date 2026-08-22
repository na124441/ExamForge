from sqlalchemy import create_engine, inspect, text
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

def auto_migrate_sqlite_schema(engine, Base):
    """
    Automatically alters SQLite tables to add missing columns defined in SQLAlchemy models.
    Prevents OperationalError: no such column errors during model updates.
    """
    try:
        inspector = inspect(engine)
        existing_tables = inspector.get_table_names()

        with engine.connect() as conn:
            for table_name, table in Base.metadata.tables.items():
                if table_name in existing_tables:
                    existing_cols = {c["name"] for c in inspector.get_columns(table_name)}
                    for column in table.columns:
                        if column.name not in existing_cols:
                            col_type = column.type.compile(engine.dialect)
                            default_clause = ""
                            if column.default is not None and hasattr(column.default, "arg"):
                                default_val = column.default.arg
                                if isinstance(default_val, str):
                                    default_clause = f" DEFAULT '{default_val}'"
                                elif isinstance(default_val, (int, float, bool)):
                                    default_clause = f" DEFAULT {default_val}"

                            alter_stmt = f'ALTER TABLE "{table_name}" ADD COLUMN "{column.name}" {col_type}{default_clause}'
                            try:
                                conn.execute(text(alter_stmt))
                                conn.commit()
                                print(f"[MIGRATION SUCCESS] Added missing column '{column.name}' to table '{table_name}'.")
                            except Exception as e:
                                print(f"[MIGRATION WARNING] Could not add column '{column.name}' to '{table_name}': {e}")
    except Exception as err:
        print(f"[MIGRATION ERROR] Auto migration encountered issue: {err}")
