"""Tests for mechanic endpoints."""

import json
from datetime import date
from tests.base_test import BaseTestCase
from application.models import Mechanic, ServiceTicket, Customer
from application.extensions import db
import bcrypt


class TestMechanicEndpoints(BaseTestCase):
    """Test cases for mechanic API endpoints."""
    
    def create_test_mechanic(self, email="mechanic@shop.com"):
        """Helper method to create a test mechanic."""
        mechanic = Mechanic(
            first_name="Mike",
            last_name="Smith",
            email=email,
            phone="555-9876",
            specialty="Engine Repair",
            hourly_rate=85.50,
            hire_date=date(2024, 1, 15)
        )
        db.session.add(mechanic)
        db.session.commit()
        return mechanic
    
    # Positive Tests
    
    def test_create_mechanic_success(self):
        """Test successful mechanic creation."""
        data = {
            'first_name': 'Tom',
            'last_name': 'Johnson',
            'email': 'tom.johnson@shop.com',
            'phone': '555-1111',
            'specialty': 'Transmission',
            'hourly_rate': 95.00,
            'hire_date': '2024-02-01'
        }
        
        response = self.client.post(
            '/mechanics/',
            data=json.dumps(data),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 201)
        response_data = json.loads(response.data)
        self.assertEqual(response_data['email'], 'tom.johnson@shop.com')
        self.assertEqual(response_data['specialty'], 'Transmission')
        self.assertIn('id', response_data)
    
    def test_create_mechanic_minimal_fields(self):
        """Test creating mechanic with only required fields."""
        data = {
            'first_name': 'Jane',
            'last_name': 'Doe',
            'email': 'jane.doe@shop.com'
        }
        
        response = self.client.post(
            '/mechanics/',
            data=json.dumps(data),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 201)
        response_data = json.loads(response.data)
        self.assertEqual(response_data['first_name'], 'Jane')
    
    def test_get_all_mechanics(self):
        """Test retrieving all mechanics."""
        self.create_test_mechanic('mechanic1@shop.com')
        self.create_test_mechanic('mechanic2@shop.com')
        
        response = self.client.get('/mechanics/')
        
        self.assertEqual(response.status_code, 200)
        response_data = json.loads(response.data)
        self.assertEqual(len(response_data), 2)
    
    def test_get_mechanic_by_id(self):
        """Test retrieving a specific mechanic by ID."""
        mechanic = self.create_test_mechanic()
        
        response = self.client.get(f'/mechanics/{mechanic.id}')
        
        self.assertEqual(response.status_code, 200)
        response_data = json.loads(response.data)
        self.assertEqual(response_data['id'], mechanic.id)
        self.assertEqual(response_data['email'], mechanic.email)
        self.assertEqual(response_data['specialty'], 'Engine Repair')
    
    def test_update_mechanic_success(self):
        """Test successful mechanic update."""
        mechanic = self.create_test_mechanic()
        
        update_data = {
            'specialty': 'Brake Specialist',
            'hourly_rate': 90.00
        }
        
        response = self.client.put(
            f'/mechanics/{mechanic.id}',
            data=json.dumps(update_data),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 200)
        response_data = json.loads(response.data)
        self.assertEqual(response_data['specialty'], 'Brake Specialist')
        self.assertEqual(response_data['hourly_rate'], 90.00)
    
    def test_delete_mechanic_success(self):
        """Test successful mechanic deletion."""
        mechanic = self.create_test_mechanic()
        
        response = self.client.delete(f'/mechanics/{mechanic.id}')
        
        self.assertEqual(response.status_code, 200)
        response_data = json.loads(response.data)
        self.assertIn('deleted successfully', response_data['message'])
    
    # Negative Tests
    
    def test_create_mechanic_missing_required_fields(self):
        """Test mechanic creation with missing required fields."""
        data = {
            'first_name': 'Mike'
            # Missing last_name and email
        }
        
        response = self.client.post(
            '/mechanics/',
            data=json.dumps(data),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 400)
        response_data = json.loads(response.data)
        self.assertIn('errors', response_data)
    
    def test_create_mechanic_duplicate_email(self):
        """Test creating mechanic with duplicate email."""
        self.create_test_mechanic('duplicate@shop.com')
        
        data = {
            'first_name': 'Another',
            'last_name': 'Mechanic',
            'email': 'duplicate@shop.com'
        }
        
        response = self.client.post(
            '/mechanics/',
            data=json.dumps(data),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 409)
        response_data = json.loads(response.data)
        self.assertIn('already exists', response_data['error'])
    
    def test_create_mechanic_invalid_email(self):
        """Test creating mechanic with invalid email format."""
        data = {
            'first_name': 'Mike',
            'last_name': 'Smith',
            'email': 'not-an-email'
        }
        
        response = self.client.post(
            '/mechanics/',
            data=json.dumps(data),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 400)
        response_data = json.loads(response.data)
        self.assertIn('errors', response_data)
    
    def test_get_mechanic_not_found(self):
        """Test retrieving non-existent mechanic."""
        response = self.client.get('/mechanics/9999')
        
        self.assertEqual(response.status_code, 404)
        response_data = json.loads(response.data)
        self.assertIn('not found', response_data['error'])
    
    def test_update_mechanic_not_found(self):
        """Test updating non-existent mechanic."""
        update_data = {
            'specialty': 'New Specialty'
        }
        
        response = self.client.put(
            '/mechanics/9999',
            data=json.dumps(update_data),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 404)
        response_data = json.loads(response.data)
        self.assertIn('not found', response_data['error'])
    
    def test_update_mechanic_duplicate_email(self):
        """Test updating mechanic with email that already exists."""
        mechanic1 = self.create_test_mechanic('mechanic1@shop.com')
        mechanic2 = self.create_test_mechanic('mechanic2@shop.com')
        
        update_data = {
            'email': 'mechanic1@shop.com'
        }
        
        response = self.client.put(
            f'/mechanics/{mechanic2.id}',
            data=json.dumps(update_data),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 409)
        response_data = json.loads(response.data)
        self.assertIn('already exists', response_data['error'])
    
    def test_delete_mechanic_not_found(self):
        """Test deleting non-existent mechanic."""
        response = self.client.delete('/mechanics/9999')
        
        self.assertEqual(response.status_code, 404)
        response_data = json.loads(response.data)
        self.assertIn('not found', response_data['error'])
    
    def test_delete_mechanic_with_service_tickets(self):
        """Test deleting mechanic who is assigned to service tickets."""
        # Create customer
        hashed_password = bcrypt.hashpw(b'password', bcrypt.gensalt())
        customer = Customer(
            first_name="Test",
            last_name="Customer",
            email="customer@email.com",
            password=hashed_password.decode('utf-8')
        )
        db.session.add(customer)
        db.session.commit()
        
        # Create mechanic
        mechanic = self.create_test_mechanic()
        
        # Create service ticket and assign mechanic
        ticket = ServiceTicket(
            customer_id=customer.id,
            description="Test ticket",
            status="Open"
        )
        db.session.add(ticket)
        db.session.commit()
        
        ticket.mechanics.append(mechanic)
        db.session.commit()
        
        # Attempt to delete mechanic
        response = self.client.delete(f'/mechanics/{mechanic.id}')
        
        self.assertEqual(response.status_code, 409)
        response_data = json.loads(response.data)
        self.assertIn('assigned to service tickets', response_data['error'])
    
    def test_update_mechanic_invalid_data(self):
        """Test updating mechanic with invalid data."""
        mechanic = self.create_test_mechanic()
        
        update_data = {
            'hourly_rate': 'not-a-number'
        }
        
        response = self.client.put(
            f'/mechanics/{mechanic.id}',
            data=json.dumps(update_data),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 400)


if __name__ == '__main__':
    unittest.main()
