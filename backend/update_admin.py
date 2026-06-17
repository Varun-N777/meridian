import sqlite3

try:
    conn = sqlite3.connect('omnipulse.db')
    c = conn.cursor()
    c.execute("UPDATE customers SET email = 'admin@meridian.ai', last_name = 'Meridian' WHERE customer_id = 'admin-001'")
    conn.commit()
    print("Successfully updated admin email to admin@meridian.ai")
except Exception as e:
    print(f"Failed to update db: {e}")
finally:
    conn.close()
