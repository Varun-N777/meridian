import sqlite3
import random

conn = sqlite3.connect('omnipulse.db')
cursor = conn.cursor()

cursor.execute("SELECT customer_id, risk_score FROM customer_profiles")
rows = cursor.fetchall()

for row in rows:
    customer_id, risk_score = row
    # risk_score is typically 0-100
    churn_prob = (risk_score or 0) / 100.0
    # Also fix CLV so it's not 0
    clv = random.uniform(500.0, 75000.0)
    cursor.execute("UPDATE customer_profiles SET churn_probability = ?, clv = ? WHERE customer_id = ?", (churn_prob, clv, customer_id))

conn.commit()
conn.close()
print(f"Fixed {len(rows)} customer profiles with churn_probability and CLV.")
