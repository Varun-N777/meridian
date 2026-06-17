import requests
import json
import sqlite3

try:
    conn = sqlite3.connect('omnipulse.db')
    c = conn.cursor()
    c.execute("SELECT customer_id FROM customers LIMIT 1")
    row = c.fetchone()
    conn.close()
    
    if not row:
        print("No customers found.")
    else:
        customer_id = row[0]
        print(f"Testing customer_id: {customer_id}")
        res = requests.post("http://localhost:8000/api/ipc/route", json={
            "type": "next_best_action",
            "payload": {"customer_id": customer_id}
        })
        print("Response Status:", res.status_code)
        print(json.dumps(res.json(), indent=2))
except Exception as e:
    print("Error:", str(e))
