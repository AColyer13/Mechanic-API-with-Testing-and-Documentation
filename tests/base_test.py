"""Base test case for all API tests."""

import unittest
import os
from application import create_app
from application.extensions import db


class BaseTestCase(unittest.TestCase):
    """Base test case that all test classes should inherit from."""
    
    def setUp(self):
        """Set up test fixtures before each test method."""
        # Set test environment
        os.environ['FLASK_ENV'] = 'testing'
        
        # Create test app
        self.app = create_app('testing')
        self.client = self.app.test_client()
        self.app_context = self.app.app_context()
        self.app_context.push()
        
        # Create all tables
        db.create_all()
    
    def tearDown(self):
        """Clean up after each test method."""
        # Remove database session and drop all tables
        db.session.remove()
        db.drop_all()
        
        # Pop application context
        self.app_context.pop()
    
    def get_auth_headers(self, token):
        """Helper method to create authentication headers."""
        return {
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        }
