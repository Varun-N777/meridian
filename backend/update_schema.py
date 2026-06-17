import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database.connection import engine, Base
from app.models.models import *

def update_schema():
    print("Updating schema to create new tables...")
    Base.metadata.create_all(bind=engine)
    print("Success! New tables created.")

if __name__ == "__main__":
    update_schema()
