import unittest
import json
from datetime import datetime
from unittest.mock import patch
from backend.app import create_app, db
from backend.models import User, ScheduleItem, Notification

class SmokeBreakTestCase(unittest.TestCase):
    def setUp(self):
        self.app = create_app()
        self.app.config['TESTING'] = True
        self.app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
        self.client = self.app.test_client()
        
        with self.app.app_context():
            db.create_all()

    def tearDown(self):
        with self.app.app_context():
            db.session.remove()
            db.drop_all()

    def register(self, username, password):
        return self.client.post('/api/register', json={
            'username': username,
            'password': password
        })

    def login(self, username, password):
        return self.client.post('/api/login', json={
            'username': username,
            'password': password
        })

    def test_auth(self):
        # Test Register
        res = self.register('testuser', 'password')
        self.assertEqual(res.status_code, 201)

        # Test Login
        res = self.login('testuser', 'password')
        self.assertEqual(res.status_code, 200)
        self.assertIn('access_token', res.json)

    def test_schedule_and_status(self):
        # Register and Login
        self.register('student1', 'pass')
        token = self.login('student1', 'pass').json['access_token']
        headers = {'Authorization': f'Bearer {token}'}

        # Add Schedule Item (Monday 10:00 - 12:00)
        res = self.client.post('/api/schedule', headers=headers, json={
            'day_of_week': 0, # Monday
            'start_time': '10:00',
            'end_time': '12:00',
            'course_name': 'Math'
        })
        self.assertEqual(res.status_code, 201)

        # Verify Schedule Item Added
        res = self.client.get('/api/schedule', headers=headers)
        self.assertEqual(len(res.json), 1)
        self.assertEqual(res.json[0]['course_name'], 'Math')

        # Test Status Logic
        # Case 1: Monday 11:00 (Should be In Class)
        with patch('backend.routes.datetime') as mock_date:
            mock_date.now.return_value = datetime(2023, 10, 23, 11, 0, 0) # Oct 23 2023 is a Monday
            mock_date.side_effect = lambda *args, **kw: datetime(*args, **kw)
            
            # We need another user to check status of student1
            self.register('observer', 'pass')
            obs_token = self.login('observer', 'pass').json['access_token']
            obs_headers = {'Authorization': f'Bearer {obs_token}'}

            res = self.client.get('/api/friends/status', headers=obs_headers)
            student1_status = next(u for u in res.json if u['username'] == 'student1')
            self.assertEqual(student1_status['status'], 'In Class')
            self.assertFalse(student1_status['is_free'])

        # Case 2: Monday 13:00 (Should be Free)
        with patch('backend.routes.datetime') as mock_date:
            mock_date.now.return_value = datetime(2023, 10, 23, 13, 0, 0) # Monday
            
            res = self.client.get('/api/friends/status', headers=obs_headers)
            student1_status = next(u for u in res.json if u['username'] == 'student1')
            self.assertEqual(student1_status['status'], 'Free')
            self.assertTrue(student1_status['is_free'])

    def test_notifications(self):
        # Setup two users
        self.register('sender', 'pass')
        sender_token = self.login('sender', 'pass').json['access_token']
        sender_headers = {'Authorization': f'Bearer {sender_token}'}

        self.register('receiver', 'pass')
        # Get receiver ID
        with self.app.app_context():
            receiver_id = User.query.filter_by(username='receiver').first().id

        # Send Invite
        res = self.client.post('/api/invite', headers=sender_headers, json={
            'receiver_id': receiver_id,
            'location': 'MA cigarette'
        })
        self.assertEqual(res.status_code, 201)

        # Check Notifications as Receiver
        receiver_token = self.login('receiver', 'pass').json['access_token']
        receiver_headers = {'Authorization': f'Bearer {receiver_token}'}

        res = self.client.get('/api/notifications', headers=receiver_headers)
        self.assertEqual(len(res.json), 1)
        self.assertEqual(res.json[0]['location'], 'MA cigarette')
        self.assertFalse(res.json[0]['is_read'])

if __name__ == '__main__':
    unittest.main()
