import psycopg2
import os

DATABASE_URL = os.environ.get('DATABASE_URL')

def init_db():
    if not DATABASE_URL:
        print("Error: DATABASE_URL environment variable not set.")
        print("Please set DATABASE_URL in your .env file or environment.")
        return

    print(f"Connecting to database...") # Don't print the URL for security

    try:
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()

        # Read schema
        print("Executing schema_postgres.sql...")
        with open('schema_postgres.sql', 'r') as f:
            cur.execute(f.read())
        
        # Read seed
        print("Executing seed_postgres.sql...")
        with open('seed_postgres.sql', 'r') as f:
            cur.execute(f.read())
        
        conn.commit()
        print("Database initialized successfully!")
        
        cur.close()
        conn.close()

    except Exception as e:
        print(f"Error initializing database: {e}")
        if 'conn' in locals() and conn:
            conn.rollback()
            conn.close()

if __name__ == '__main__':
    init_db()
