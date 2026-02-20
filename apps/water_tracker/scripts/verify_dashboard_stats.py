import unittest
import json
from flask import session
from app import app, db

class DashboardStatsTest(unittest.TestCase):

    def test_api_stats_authorized(self):
        with app.test_client() as c:
            # 1. Login
            response = c.post('/api/login', 
                       data=json.dumps(dict(username='admin', password='admin123')),
                       content_type='application/json')
            print(f"Login Status: {response.status_code}")
            
            # Debug Session and Cookie Jar
            with c.session_transaction() as sess:
                print(f"Session after login: {dict(sess)}")
            
            # Inspect cookie jar (if accessible, otherwise rely on session)
            # print(c.cookie_jar) 

            # 2. Get Stats
            response = c.get('/api/stats')
            print(f"Stats Status: {response.status_code}")
            if response.status_code != 200:
                print(f"Stats Response: {response.data}")
            
            self.assertEqual(response.status_code, 200)
            data = json.loads(response.data)
        
        # 3. Check Structure
        self.assertIn('total_cost', data)
        self.assertIn('total_volume_kl', data)
        self.assertIn('avg_rate', data)
        self.assertIn('recent_activity', data) # Should be empty list initially
        
        print("\nAPI Stats Verification Successful:")
        print(f"Total Cost: {data['total_cost']}")
        print(f"Total Volume: {data['total_volume_kl']}")
        print(f"Recent Activity Count: {len(data['recent_activity'])}")

    def test_api_stats_unauthorized(self):
        # No login
        with app.test_client() as c:
            response = c.get('/api/stats')
            self.assertEqual(response.status_code, 401)

if __name__ == "__main__":
    unittest.main()
