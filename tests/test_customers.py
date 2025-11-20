"""Tests for customer endpoints."""

import json
from tests.base_test import BaseTestCase
from application.models import Customer
from application.extensions import db
import bcrypt


class TestCustomerEndpoints(BaseTestCase):
    """Test cases for customer API endpoints."""
    
    def create_test_customer(self, email="test@email.com", password="TestPassword123"):
        """Helper method to create a test customer."""
        hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
        customer = Customer(
            first_name="Test",
            last_name="User",
            email=email,
            password=hashed_password.decode('utf-8'),
            phone="555-1234",
            address="123 Test St"
        )
        db.session.add(customer)
        db.session.commit()
        return customer
    
    def login_customer(self, email="test@email.com", password="TestPassword123"):
        """Helper method to login and get token."""
        response = self.client.post(
            '/customers/login',
            data=json.dumps({'email': email, 'password': password}),
            content_type='application/json'
        )
        return json.loads(response.data)
    
    # Positive Tests
    
    def test_create_customer_success(self):
        """Test successful customer creation."""
        data = {
            'first_name': 'John',
            'last_name': 'Doe',
            'email': 'john.doe@email.com',
            'password': 'SecurePass123',
            'phone': '555-5678',
            'address': '456 Main St'
        }
        
        response = self.client.post(
            '/customers/',
            data=json.dumps(data),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 201)
        response_data = json.loads(response.data)
        self.assertEqual(response_data['email'], 'john.doe@email.com')
        self.assertEqual(response_data['first_name'], 'John')
        self.assertIn('id', response_data)
    
    def test_customer_login_success(self):
        """Test successful customer login."""
        # Create customer first
        self.create_test_customer()
        
        # Attempt login
        data = {
            'email': 'test@email.com',
            'password': 'TestPassword123'
        }
        
        response = self.client.post(
            '/customers/login',
            data=json.dumps(data),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 200)
        response_data = json.loads(response.data)
        self.assertIn('token', response_data)
        self.assertIn('customer', response_data)
        self.assertEqual(response_data['message'], 'Login successful')
    
    def test_get_all_customers(self):
        """Test retrieving all customers."""
        # Create test customers
        self.create_test_customer('customer1@email.com')
        self.create_test_customer('customer2@email.com')
        
        response = self.client.get('/customers/')
        
        self.assertEqual(response.status_code, 200)
        response_data = json.loads(response.data)
        self.assertEqual(len(response_data), 2)
    
    def test_get_customer_by_id(self):
        """Test retrieving a specific customer by ID."""
        customer = self.create_test_customer()
        
        response = self.client.get(f'/customers/{customer.id}')
        
        self.assertEqual(response.status_code, 200)
        response_data = json.loads(response.data)
        self.assertEqual(response_data['id'], customer.id)
        self.assertEqual(response_data['email'], customer.email)
    
    def test_update_customer_success(self):
        """Test successful customer update."""
        customer = self.create_test_customer()
        login_data = self.login_customer()
        token = login_data['token']
        
        update_data = {
            'first_name': 'Updated',
            'phone': '555-9999'
        }
        
        response = self.client.put(
            f'/customers/{customer.id}',
            data=json.dumps(update_data),
            headers=self.get_auth_headers(token)
        )
        
        self.assertEqual(response.status_code, 200)
        response_data = json.loads(response.data)
        self.assertEqual(response_data['first_name'], 'Updated')
        self.assertEqual(response_data['phone'], '555-9999')
    
    def test_delete_customer_success(self):
        """Test successful customer deletion."""
        customer = self.create_test_customer()
        login_data = self.login_customer()
        token = login_data['token']
        
        response = self.client.delete(
            f'/customers/{customer.id}',
            headers=self.get_auth_headers(token)
        )
        
        self.assertEqual(response.status_code, 200)
        response_data = json.loads(response.data)
        self.assertIn('deleted successfully', response_data['message'])
    
    def test_get_my_tickets_success(self):
        """Test retrieving authenticated customer's tickets."""
        customer = self.create_test_customer()
        login_data = self.login_customer()
        token = login_data['token']
        
        response = self.client.get(
            '/customers/my-tickets',
            headers=self.get_auth_headers(token)
        )
        
        self.assertEqual(response.status_code, 200)
        response_data = json.loads(response.data)
        self.assertIsInstance(response_data, list)
    
    # Negative Tests
    
    def test_create_customer_missing_required_fields(self):
        """Test customer creation with missing required fields."""
        data = {
            'first_name': 'John'
            # Missing last_name, email, password
        }
        
        response = self.client.post(
            '/customers/',
            data=json.dumps(data),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 400)
        response_data = json.loads(response.data)
        self.assertIn('errors', response_data)
    
    def test_create_customer_duplicate_email(self):
        """Test creating customer with duplicate email."""
        self.create_test_customer('duplicate@email.com')
        
        data = {
            'first_name': 'Jane',
            'last_name': 'Doe',
            'email': 'duplicate@email.com',
            'password': 'Password123'
        }
        
        response = self.client.post(
            '/customers/',
            data=json.dumps(data),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 409)
        response_data = json.loads(response.data)
        self.assertIn('already exists', response_data['error'])
    
    def test_customer_login_invalid_email(self):
        """Test login with non-existent email."""
        data = {
            'email': 'nonexistent@email.com',
            'password': 'Password123'
        }
        
        response = self.client.post(
            '/customers/login',
            data=json.dumps(data),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 401)
        response_data = json.loads(response.data)
        self.assertIn('Invalid', response_data['error'])
    
    def test_customer_login_invalid_password(self):
        """Test login with incorrect password."""
        self.create_test_customer()
        
        data = {
            'email': 'test@email.com',
            'password': 'WrongPassword'
        }
        
        response = self.client.post(
            '/customers/login',
            data=json.dumps(data),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 401)
        response_data = json.loads(response.data)
        self.assertIn('Invalid', response_data['error'])
    
    def test_get_customer_not_found(self):
        """Test retrieving non-existent customer."""
        response = self.client.get('/customers/9999')
        
        self.assertEqual(response.status_code, 404)
        response_data = json.loads(response.data)
        self.assertIn('not found', response_data['error'])
    
    def test_update_customer_without_token(self):
        """Test updating customer without authentication token."""
        customer = self.create_test_customer()
        
        update_data = {
            'first_name': 'Updated'
        }
        
        response = self.client.put(
            f'/customers/{customer.id}',
            data=json.dumps(update_data),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 401)
    
    def test_update_different_customer_account(self):
        """Test updating a different customer's account."""
        customer1 = self.create_test_customer('customer1@email.com')
        customer2 = self.create_test_customer('customer2@email.com', 'Pass456')
        
        # Login as customer1
        login_data = self.login_customer('customer1@email.com', 'TestPassword123')
        token = login_data['token']
        
        # Attempt to update customer2's account
        update_data = {'first_name': 'Hacker'}
        
        response = self.client.put(
            f'/customers/{customer2.id}',
            data=json.dumps(update_data),
            headers=self.get_auth_headers(token)
        )
        
        self.assertEqual(response.status_code, 403)
        response_data = json.loads(response.data)
        self.assertIn('only update your own', response_data['error'])
    
    def test_delete_customer_without_token(self):
        """Test deleting customer without authentication token."""
        customer = self.create_test_customer()
        
        response = self.client.delete(f'/customers/{customer.id}')
        
        self.assertEqual(response.status_code, 401)
    
    def test_get_my_tickets_without_token(self):
        """Test accessing my-tickets endpoint without token."""
        response = self.client.get('/customers/my-tickets')
        
        self.assertEqual(response.status_code, 401)


if __name__ == '__main__':
    unittest.main()
