from app.database import SessionLocal
from app.models import AuditLog

db = SessionLocal()
logs = db.query(AuditLog).all()
print("--- Log entries ---")
for l in logs:
    print(f"ID: {l.id} | Action: {l.action} | Actor: {l.actor_id} | Payload: {l.payload_hash}")
db.close()
