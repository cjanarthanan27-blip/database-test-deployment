import unittest
import json
from app import app, db

class LoginTests(unittest.TestCase):

    def setUp(self):
        app.config['TESTING'] = True
        self.app = app.test_client()

    def test_login_page_load(self):
        response = self.app.get('/')
        self.assertEqual(response.status_code, 200)
        self.assertIn(b'Admin Login', response.data)

    def test_login_success(self):
        # Default seed user: admin / admin123
        response = self.app.post('/api/login', 
                                 data=json.dumps(dict(username='admin', password='admin123')),
                                 content_type='application/json')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertEqual(data['message'], 'Login successful')
        
    def test_login_fail(self):
        response = self.app.post('/api/login', 
                                 data=json.dumps(dict(username='admin', password='wrongpassword')),
                                 content_type='application/json')
        self.assertEqual(response.status_code, 401)
        data = json.loads(response.data)
        self.assertEqual(data['message'], 'Invalid username or password')

    def test_dashboard_access(self):
        # 1. Login first
        with self.app as c:
            response = c.post('/api/login', 
                                     data=json.dumps(dict(username='admin', password='admin123')),
                                     content_type='application/json')
            # 2. Access dashboard
            response = c.get('/dashboard')
            self.assertEqual(response.status_code, 200)
            self.assertIn(b'Dashboard > Home', response.data)

if __name__ == "__main__":
    unittest.main()
