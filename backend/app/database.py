from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import Column, String
from sqlalchemy.ext.declarative import declared_attr

# Import from unified session settings
from app.db.session import engine, SessionLocal, get_db

class CustomBase:
    @declared_attr
    def institution_id(cls):
        if hasattr(cls, "__tablename__") and cls.__tablename__:
            return Column(String, default="INS-GENESIS", nullable=True)
        return None

Base = declarative_base(cls=CustomBase)
