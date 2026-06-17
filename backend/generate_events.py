import sqlite3
import random
import uuid
from datetime import datetime, timedelta
import json

def gen_id():
    return str(uuid.uuid4())

conn = sqlite3.connect('omnipulse.db')
c = conn.cursor()

c.execute("SELECT customer_id FROM customers")
customers = c.fetchall()

event_types = ['LOGIN', 'PAGE_VIEW', 'PRODUCT_VIEW', 'ADD_TO_CART', 'PURCHASE', 'SUPPORT_TICKET', 'CAMPAIGN_OPEN', 'CAMPAIGN_CLICK']

count = 0
for (customer_id,) in customers:
    num_events = random.randint(5, 20)
    base_time = datetime.utcnow() - timedelta(days=random.randint(1, 30))
    
    for i in range(num_events):
        ev_type = random.choice(event_types)
        ev_value = f"Triggered {ev_type}"
        if ev_type == 'PURCHASE':
            ev_value = f"Order #{random.randint(1000, 9999)} - Rs. {random.randint(500, 5000)}"
        elif ev_type == 'SUPPORT_TICKET':
            ev_value = f"Ticket #{random.randint(100, 999)} opened"
            
        timestamp = base_time + timedelta(hours=i*random.uniform(1, 24))
        
        c.execute("""
            INSERT INTO events (event_id, customer_id, event_type, event_value, timestamp, metadata_json)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (gen_id(), customer_id, ev_type, ev_value, timestamp.strftime("%Y-%m-%d %H:%M:%S.%f"), json.dumps({"source": "system_gen"})))
        count += 1
        
conn.commit()
conn.close()
print(f"Generated {count} events for {len(customers)} customers.")
