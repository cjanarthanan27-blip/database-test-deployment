import sqlite3

def check_data():
    conn = sqlite3.connect('water_tracker.db')
    cursor = conn.cursor()
    try:
        tables = ['users', 'master_locations', 'master_sources']
        for table in tables:
            cursor.execute(f"SELECT COUNT(*) FROM {table}")
            count = cursor.fetchone()[0]
            print(f"{table}: {count}")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    check_data()
