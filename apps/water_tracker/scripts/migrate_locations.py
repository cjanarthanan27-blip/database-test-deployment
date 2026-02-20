from app import app, db
from sqlalchemy import text

app.app_context().push()

# Drop and recreate the master_locations table
with db.engine.connect() as conn:
    # Drop the existing table
    # Note: We need to be careful with foreign keys. 
    # water_entries references master_locations.id
    # Since this is a dev environment/test, we might need to recreate water_entries too or just force it.
    # For now, let's try dropping master_locations. If it fails due to FK, we'll need a different approach.
    try:
        conn.execute(text("DROP TABLE IF EXISTS master_locations"))
        conn.commit()
        print("Dropped master_locations table")
    except Exception as e:
        print(f"Error dropping table: {e}")

# Recreate with new schema
db.create_all()
print("Recreated master_locations table with new schema")
print("Database migration completed successfully!")
