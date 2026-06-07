import sys
import os

# Append current directory to path
sys.path.append(os.path.abspath(os.path.dirname(__file__)))

try:
    from app.database import engine, Base
    import app.models as models
    
    print("Initializing SQLite tables...")
    Base.metadata.create_all(bind=engine)
    
    # Check if database file exists
    db_path = "examforge.db"
    if os.path.exists(db_path):
        print(f"Success! SQLite database created at: {os.path.abspath(db_path)}")
    else:
        print("Warning: Base.metadata.create_all ran but database file not found at default path.")
        
    print("Database configuration and model mapping completed successfully.")
except Exception as e:
    print(f"Error occurred: {e}", file=sys.stderr)
    import traceback
    traceback.print_exc()
    sys.exit(1)
