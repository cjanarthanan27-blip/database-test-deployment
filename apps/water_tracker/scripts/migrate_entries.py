from app import app, db
from models import WaterEntry
from sqlalchemy import text

def migrate_database():
    with app.app_context():
        print("Starting migration...")
        
        # 1. Rename existing table
        try:
            db.session.execute(text("ALTER TABLE water_entries RENAME TO water_entries_old"))
            print("Renamed water_entries to water_entries_old")
        except Exception as e:
            print(f"Error renaming table (maybe it doesn't exist?): {e}")

        # 2. Create new table
        # We use SQLAlchemy's create_all which will create the table based on the new model definition
        # since water_entries table no longer exists (renamed)
        db.create_all()
        print("Created new water_entries table")

        # 3. Copy data
        # We need to explicitly list columns because the schema changed
        # Old table columns: id, entry_date, source_id, unloading_location_id, shift, water_type, vehicle_id, load_count, total_quantity_liters, total_cost, created_at, created_by
        # New table columns: id, entry_date, source_id, loading_location_id, unloading_location_id, shift, water_type, vehicle_id, load_count, total_quantity_liters, total_cost, created_at, created_by
        
        # We copy source_id to source_id. loading_location_id will be NULL (default).
        
        try:
            # Check if water_entries_old exists
            result = db.session.execute(text("SELECT name FROM sqlite_master WHERE type='table' AND name='water_entries_old'"))
            if result.fetchone():
                print("Copying data from water_entries_old...")
                
                # Construct INSERT SELECT statement
                # map old columns to new columns
                sql = """
                INSERT INTO water_entries (
                    id, entry_date, source_id, unloading_location_id, 
                    shift, water_type, vehicle_id, load_count, 
                    total_quantity_liters, total_cost, created_at, created_by
                )
                SELECT 
                    id, entry_date, source_id, unloading_location_id, 
                    shift, water_type, vehicle_id, load_count, 
                    total_quantity_liters, total_cost, created_at, created_by
                FROM water_entries_old
                """
                
                db.session.execute(text(sql))
                db.session.commit()
                print("Data copied successfully")
                
                # 4. Drop old table
                # db.session.execute(text("DROP TABLE water_entries_old"))
                # print("Dropped water_entries_old")
            else:
                print("No old table found to copy from.")
                
        except Exception as e:
            print(f"Error copying data: {e}")
            db.session.rollback()

if __name__ == '__main__':
    migrate_database()
