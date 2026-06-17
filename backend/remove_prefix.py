import sqlite3

conn = sqlite3.connect('omnipulse.db')
c = conn.cursor()

c.execute("UPDATE customers SET first_name = SUBSTR(first_name, 10) WHERE first_name LIKE 'Tier 3 - %'")

conn.commit()
conn.close()
print("Removed 'Tier 3 - ' prefix from customer names.")
