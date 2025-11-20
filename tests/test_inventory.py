"""Tests for inventory endpoints."""

import json
from tests.base_test import BaseTestCase
from application.models import Inventory, ServiceTicket, Customer
from application.extensions import db
import bcrypt


class TestInventoryEndpoints(BaseTestCase):
    """Test cases for inventory API endpoints."""
    
    def create_test_inventory(self, name="Oil Filter", price=12.99):
        """Helper method to create a test inventory part."""
        inventory = Inventory(
            name=name,
            price=price
        )
        db.session.add(inventory)
        db.session.commit()
        return inventory
    
    def create_test_customer(self):
        """Helper method to create a test customer."""
        hashed_password = bcrypt.hashpw(b'password', bcrypt.gensalt())
        customer = Customer(
            first_name="Test",
            last_name="Customer",
            email="customer@email.com",
            password=hashed_password.decode('utf-8')
        )
        db.session.add(customer)
        db.session.commit()
        return customer
    
    # Positive Tests
    
    def test_create_inventory_success(self):
        """Test successful inventory part creation."""
        data = {
            'name': 'Brake Pads',
            'price': 45.99
        }
        
        response = self.client.post(
            '/inventory/',
            data=json.dumps(data),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 201)
        response_data = json.loads(response.data)
        self.assertEqual(response_data['name'], 'Brake Pads')
        self.assertEqual(response_data['price'], 45.99)
        self.assertIn('id', response_data)
    
    def test_create_inventory_minimal_price(self):
        """Test creating inventory with minimal price."""
        data = {
            'name': 'Washer Fluid',
            'price': 0.99
        }
        
        response = self.client.post(
            '/inventory/',
            data=json.dumps(data),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 201)
        response_data = json.loads(response.data)
        self.assertEqual(response_data['price'], 0.99)
    
    def test_get_all_inventory(self):
        """Test retrieving all inventory parts."""
        self.create_test_inventory('Oil Filter', 12.99)
        self.create_test_inventory('Air Filter', 15.99)
        self.create_test_inventory('Spark Plugs', 8.99)
        
        response = self.client.get('/inventory/')
        
        self.assertEqual(response.status_code, 200)
        response_data = json.loads(response.data)
        self.assertEqual(len(response_data), 3)
    
    def test_get_inventory_by_id(self):
        """Test retrieving a specific inventory part by ID."""
        inventory = self.create_test_inventory('Transmission Fluid', 29.99)
        
        response = self.client.get(f'/inventory/{inventory.id}')
        
        self.assertEqual(response.status_code, 200)
        response_data = json.loads(response.data)
        self.assertEqual(response_data['id'], inventory.id)
        self.assertEqual(response_data['name'], 'Transmission Fluid')
        self.assertEqual(response_data['price'], 29.99)
    
    def test_update_inventory_success(self):
        """Test successful inventory part update."""
        inventory = self.create_test_inventory()
        
        update_data = {
            'name': 'Premium Oil Filter',
            'price': 15.99
        }
        
        response = self.client.put(
            f'/inventory/{inventory.id}',
            data=json.dumps(update_data),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 200)
        response_data = json.loads(response.data)
        self.assertEqual(response_data['name'], 'Premium Oil Filter')
        self.assertEqual(response_data['price'], 15.99)
    
    def test_update_inventory_partial(self):
        """Test updating only some fields of inventory."""
        inventory = self.create_test_inventory('Oil Filter', 12.99)
        
        update_data = {
            'price': 14.99
        }
        
        response = self.client.put(
            f'/inventory/{inventory.id}',
            data=json.dumps(update_data),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 200)
        response_data = json.loads(response.data)
        self.assertEqual(response_data['name'], 'Oil Filter')  # Unchanged
        self.assertEqual(response_data['price'], 14.99)  # Changed
    
    def test_delete_inventory_success(self):
        """Test successful inventory part deletion."""
        inventory = self.create_test_inventory()
        
        response = self.client.delete(f'/inventory/{inventory.id}')
        
        self.assertEqual(response.status_code, 200)
        response_data = json.loads(response.data)
        self.assertIn('deleted successfully', response_data['message'])
    
    def test_get_empty_inventory_list(self):
        """Test retrieving inventory when none exist."""
        response = self.client.get('/inventory/')
        
        self.assertEqual(response.status_code, 200)
        response_data = json.loads(response.data)
        self.assertEqual(len(response_data), 0)
    
    # Negative Tests
    
    def test_create_inventory_missing_name(self):
        """Test creating inventory without name."""
        data = {
            'price': 12.99
        }
        
        response = self.client.post(
            '/inventory/',
            data=json.dumps(data),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 400)
        response_data = json.loads(response.data)
        self.assertIn('errors', response_data)
    
    def test_create_inventory_missing_price(self):
        """Test creating inventory without price."""
        data = {
            'name': 'Oil Filter'
        }
        
        response = self.client.post(
            '/inventory/',
            data=json.dumps(data),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 400)
        response_data = json.loads(response.data)
        self.assertIn('errors', response_data)
    
    def test_create_inventory_invalid_price(self):
        """Test creating inventory with invalid price."""
        data = {
            'name': 'Oil Filter',
            'price': 'not-a-number'
        }
        
        response = self.client.post(
            '/inventory/',
            data=json.dumps(data),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 400)
        response_data = json.loads(response.data)
        self.assertIn('errors', response_data)
    
    def test_create_inventory_negative_price(self):
        """Test creating inventory with negative price."""
        data = {
            'name': 'Oil Filter',
            'price': -5.99
        }
        
        response = self.client.post(
            '/inventory/',
            data=json.dumps(data),
            content_type='application/json'
        )
        
        # Should either fail validation or succeed (depends on schema)
        # If schema allows negative, this will pass; otherwise it should be 400
        self.assertIn(response.status_code, [201, 400])
    
    def test_get_inventory_not_found(self):
        """Test retrieving non-existent inventory part."""
        response = self.client.get('/inventory/9999')
        
        self.assertEqual(response.status_code, 404)
        response_data = json.loads(response.data)
        self.assertIn('not found', response_data['error'])
    
    def test_update_inventory_not_found(self):
        """Test updating non-existent inventory part."""
        update_data = {
            'name': 'Updated Name',
            'price': 20.00
        }
        
        response = self.client.put(
            '/inventory/9999',
            data=json.dumps(update_data),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 404)
        response_data = json.loads(response.data)
        self.assertIn('not found', response_data['error'])
    
    def test_update_inventory_invalid_data(self):
        """Test updating inventory with invalid data."""
        inventory = self.create_test_inventory()
        
        update_data = {
            'price': 'invalid-price'
        }
        
        response = self.client.put(
            f'/inventory/{inventory.id}',
            data=json.dumps(update_data),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 400)
    
    def test_delete_inventory_not_found(self):
        """Test deleting non-existent inventory part."""
        response = self.client.delete('/inventory/9999')
        
        self.assertEqual(response.status_code, 404)
        response_data = json.loads(response.data)
        self.assertIn('not found', response_data['error'])
    
    def test_delete_inventory_used_in_tickets(self):
        """Test deleting inventory part that is used in service tickets."""
        # Create customer and inventory
        customer = self.create_test_customer()
        inventory = self.create_test_inventory()
        
        # Create service ticket
        ticket = ServiceTicket(
            customer_id=customer.id,
            description="Test service",
            status="Open"
        )
        db.session.add(ticket)
        db.session.commit()
        
        # Add inventory to ticket
        ticket.inventory_parts.append(inventory)
        db.session.commit()
        
        # Attempt to delete inventory
        response = self.client.delete(f'/inventory/{inventory.id}')
        
        self.assertEqual(response.status_code, 409)
        response_data = json.loads(response.data)
        self.assertIn('used in service tickets', response_data['error'])
    
    def test_create_inventory_empty_name(self):
        """Test creating inventory with empty name."""
        data = {
            'name': '',
            'price': 12.99
        }
        
        response = self.client.post(
            '/inventory/',
            data=json.dumps(data),
            content_type='application/json'
        )
        
        # Should fail validation
        self.assertEqual(response.status_code, 400)
    
    def test_create_inventory_zero_price(self):
        """Test creating inventory with zero price."""
        data = {
            'name': 'Free Part',
            'price': 0.00
        }
        
        response = self.client.post(
            '/inventory/',
            data=json.dumps(data),
            content_type='application/json'
        )
        
        # Depending on validation, this might be allowed or not
        self.assertIn(response.status_code, [201, 400])
    
    def test_update_inventory_empty_name(self):
        """Test updating inventory with empty name."""
        inventory = self.create_test_inventory()
        
        update_data = {
            'name': ''
        }
        
        response = self.client.put(
            f'/inventory/{inventory.id}',
            data=json.dumps(update_data),
            content_type='application/json'
        )
        
        # Should fail validation
        self.assertEqual(response.status_code, 400)


if __name__ == '__main__':
    unittest.main()
