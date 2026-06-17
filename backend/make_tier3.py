import sqlite3

conn = sqlite3.connect('omnipulse.db')
c = conn.cursor()

# Get 5 random customers to make them Tier 3
c.execute("SELECT customer_id FROM customers ORDER BY RANDOM() LIMIT 5")
rows = c.fetchall()

for (cid,) in rows:
    # Set profile segment to complex_case to trigger the new InferenceRouter logic
    c.execute("UPDATE customer_profiles SET segment = 'complex_case' WHERE customer_id = ?", (cid,))
    # Prepend 'Tier 3' to their name so the user can find them easily in the sidebar
    c.execute("UPDATE customers SET first_name = 'Tier 3 - ' || first_name WHERE customer_id = ?", (cid,))

conn.commit()
conn.close()
print("Updated 5 random customers to Tier 3 complex cases.")
