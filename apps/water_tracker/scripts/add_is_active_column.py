from app import app, db
from sqlalchemy import text

with app.app_context():
    try:
        # Add is_active column to master_locations
        db.session.execute(text("ALTER TABLE master_locations ADD COLUMN is_active BOOLEAN DEFAULT 1"))
        
        # Update all existing records to have is_active = 1
        db.session.execute(text("UPDATE master_locations SET is_active = 1 WHERE is_active IS NULL"))
        
        db.session.commit()
        print("Successfully added is_active column to master_locations table!")
        
        # Verify the change
        result = db.session.execute(text("SELECT * FROM master_locations LIMIT 1"))
        columns = result.keys()
        print(f"Columns in master_locations: {list(columns)}")
        
    except Exception as e:
        print(f"Error: {e}")
        db.session.rollback()
