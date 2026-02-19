from app import app, db
from sqlalchemy import text

app.app_context().push()

# Drop and recreate the rate_history_internal_vehicles table
with db.engine.connect() as conn:
    # Drop the existing table
    conn.execute(text("DROP TABLE IF EXISTS rate_history_internal_vehicles"))
    conn.commit()
    print("Dropped rate_history_internal_vehicles table")

# Recreate with new schema
db.create_all()
print("Recreated rate_history_internal_vehicles table with new schema")
print("Database migration completed successfully!")
