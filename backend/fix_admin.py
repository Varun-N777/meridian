import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database.connection import SessionLocal, init_db
from app.models.models import Customer
from app.utils.auth import hash_password

init_db()
db = SessionLocal()

admin = db.query(Customer).filter(Customer.email == 'admin@omnipulse.ai').first()
if not admin:
    print("Admin does not exist, creating...")
    admin = Customer(
        customer_id="ADMIN-001",
        first_name="Admin",
        last_name="User",
        email="admin@omnipulse.ai",
        password_hash=hash_password("admin123"),
        role="admin",
        status="active",
        city="Mumbai"
    )
    db.add(admin)
else:
    print("Admin exists, updating password...")
    admin.password_hash = hash_password("admin123")
    admin.role = "admin"

db.commit()
print("Admin user fixed successfully.")
