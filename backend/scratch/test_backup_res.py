from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal
from app.models import User
from app.security import hash_password

client = TestClient(app)

db = SessionLocal()
# Let's find a platform super admin or create one
user = db.query(User).filter(User.email == "platform_admin@example.com").first()
if not user:
    user = User(
        name="Platform Super Admin",
        email="platform_admin@example.com",
        password_hash=hash_password("password123"),
        status="ACTIVE"
    )
    db.add(user)
    db.commit()
    db.refresh(user)
db.close()

# Login
login_res = client.post("/api/auth/login", json={"email": "platform_admin@example.com", "password": "password123"})
print("Login Status:", login_res.status_code)
token = login_res.json()["access_token"]
headers = {"Authorization": f"Bearer {token}"}

# Call backup/create
res = client.post("/api/backup/create", headers=headers)
print("Backup Status:", res.status_code)
print("Backup Response JSON:", res.json())
