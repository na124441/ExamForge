import sys
import os

# Add current folder to path
sys.path.append(os.path.abspath(os.path.dirname(__file__)))

from app.database import SessionLocal
from app.pilot.demo_reset import reset_pilot_database
from app.pilot.demo_seed import run_pilot_seeder

def main():
    print("=== ExamForge v1.0 AuthorityPilot One-Click Seeder ===")
    
    # 1. Clean Database
    reset_pilot_database()
    
    # 2. Seed Data
    db = SessionLocal()
    try:
        run_pilot_seeder(db)
        print("=== Seeding completed successfully. ready for Pilot Demo. ===")
    except Exception as e:
        print(f"ERROR: Seeding failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    finally:
        db.close()

if __name__ == "__main__":
    main()
