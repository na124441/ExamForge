from app.database import engine, Base
import app.models as models

def reset_pilot_database():
    """
    Cleans and recreates all database tables to guarantee a consistent seeder state.
    """
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    print("[RESET] Database tables dropped and re-created successfully.")
