import unittest
import json
from app import app, db

class BasicTests(unittest.TestCase):

    def setUp(self):
        app.config['TESTING'] = True
        # app.config['SQLALCHEMY_DATABASE_URI'] uses the absolute path from app.py
        self.app = app.test_client()
        # db.create_all() # Not needed as we use the seeded database

    def test_index(self):
        response = self.app.get('/')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertEqual(data['message'], "Water Purchase Tracker API is running!")

    def test_database_connection(self):
        response = self.app.get('/test-db')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertEqual(data['status'], "success")
        # Check if seed data exists (we expect counts > 0)
        self.assertGreater(data['counts']['users'], 0)
        self.assertGreater(data['counts']['locations'], 0)
        self.assertGreater(data['counts']['sources'], 0)
        print("\nDatabase Verification Successful:")
        print(f"Users: {data['counts']['users']}")
        print(f"Locations: {data['counts']['locations']}")
        print(f"Sources: {data['counts']['sources']}")

if __name__ == "__main__":
    unittest.main()
