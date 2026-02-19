import sqlite3
import os

db_path = 'db.sqlite3'

if not os.path.exists(db_path):
    print(f"Database {db_path} not found.")
    exit(1)

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

try:
    print("Updating django_migrations table...")
    cursor.execute("UPDATE django_migrations SET app = 'water_tracker' WHERE app = 'core'")
    
    print("Updating django_content_type table...")
    cursor.execute("UPDATE django_content_type SET app_label = 'water_tracker' WHERE app_label = 'core'")
    
    conn.commit()
    print("Successfully updated database records.")
except Exception as e:
    conn.rollback()
    print(f"Error updating database: {e}")
finally:
    conn.close()
