"""Tests for service ticket endpoints."""

import json
from datetime import date
from tests.base_test import BaseTestCase
from application.models import ServiceTicket, Customer, Mechanic, Inventory
from application.extensions import db
import bcrypt


class TestServiceTicketEndpoints(BaseTestCase):
    """Test cases for service ticket API endpoints."""
    
    def create_test_customer(self, email="customer@email.com"):
        """Helper method to create a test customer."""
        hashed_password = bcrypt.hashpw(b'password', bcrypt.gensalt())
        customer = Customer(
            first_name="Test",
            last_name="Customer",
            email=email,
            password=hashed_password.decode('utf-8'),
            phone="555-1234"
        )
        db.session.add(customer)
        db.session.commit()
        return customer
    
    def create_test_mechanic(self, email="mechanic@shop.com"):
        """Helper method to create a test mechanic."""
        mechanic = Mechanic(
            first_name="Mike",
            last_name="Smith",
            email=email,
            phone="555-9876",
            specialty="Engine Repair",
            hourly_rate=85.50
        )
        db.session.add(mechanic)
        db.session.commit()
        return mechanic
    
    def create_test_inventory(self, name="Oil Filter"):
        """Helper method to create a test inventory part."""
        inventory = Inventory(
            name=name,
            price=12.99
        )
        db.session.add(inventory)
        db.session.commit()
        return inventory
    
    def create_test_ticket(self, customer_id):
        """Helper method to create a test service ticket."""
        ticket = ServiceTicket(
            customer_id=customer_id,
            vehicle_year=2020,
            vehicle_make="Toyota",
            vehicle_model="Camry",
            vehicle_vin="1HGBH41JXMN109186",
            description="Oil change needed",
            estimated_cost=150.00,
            status="Open"
        )
        db.session.add(ticket)
        db.session.commit()
        return ticket
    
    # Positive Tests
    
    def test_create_service_ticket_success(self):
        """Test successful service ticket creation."""
        customer = self.create_test_customer()
        
        data = {
            'customer_id': customer.id,
            'vehicle_year': 2021,
            'vehicle_make': 'Honda',
            'vehicle_model': 'Accord',
            'vehicle_vin': '1HGCV1F30JA123456',
            'description': 'Brake inspection and repair',
            'estimated_cost': 300.00,
            'status': 'Open'
        }
        
        response = self.client.post(
            '/service-tickets/',
            data=json.dumps(data),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 201)
        response_data = json.loads(response.data)
        self.assertEqual(response_data['customer_id'], customer.id)
        self.assertEqual(response_data['vehicle_make'], 'Honda')
        self.assertIn('id', response_data)
    
    def test_get_all_service_tickets(self):
        """Test retrieving all service tickets."""
        customer = self.create_test_customer()
        self.create_test_ticket(customer.id)
        self.create_test_ticket(customer.id)
        
        response = self.client.get('/service-tickets/')
        
        self.assertEqual(response.status_code, 200)
        response_data = json.loads(response.data)
        self.assertEqual(len(response_data), 2)
    
    def test_get_service_ticket_by_id(self):
        """Test retrieving a specific service ticket by ID."""
        customer = self.create_test_customer()
        ticket = self.create_test_ticket(customer.id)
        
        response = self.client.get(f'/service-tickets/{ticket.id}')
        
        self.assertEqual(response.status_code, 200)
        response_data = json.loads(response.data)
        self.assertEqual(response_data['id'], ticket.id)
        self.assertEqual(response_data['description'], 'Oil change needed')
    
    def test_update_service_ticket_success(self):
        """Test successful service ticket update."""
        customer = self.create_test_customer()
        ticket = self.create_test_ticket(customer.id)
        
        update_data = {
            'description': 'Oil change and tire rotation',
            'actual_cost': 145.50,
            'status': 'In Progress'
        }
        
        response = self.client.put(
            f'/service-tickets/{ticket.id}',
            data=json.dumps(update_data),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 200)
        response_data = json.loads(response.data)
        self.assertEqual(response_data['description'], 'Oil change and tire rotation')
        self.assertEqual(response_data['status'], 'In Progress')
    
    def test_update_ticket_to_completed_sets_timestamp(self):
        """Test that updating status to Completed sets completed_at timestamp."""
        customer = self.create_test_customer()
        ticket = self.create_test_ticket(customer.id)
        
        update_data = {
            'status': 'Completed',
            'actual_cost': 150.00
        }
        
        response = self.client.put(
            f'/service-tickets/{ticket.id}',
            data=json.dumps(update_data),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 200)
        response_data = json.loads(response.data)
        self.assertEqual(response_data['status'], 'Completed')
        self.assertIsNotNone(response_data.get('completed_at'))
    
    def test_delete_service_ticket_success(self):
        """Test successful service ticket deletion."""
        customer = self.create_test_customer()
        ticket = self.create_test_ticket(customer.id)
        
        response = self.client.delete(f'/service-tickets/{ticket.id}')
        
        self.assertEqual(response.status_code, 200)
        response_data = json.loads(response.data)
        self.assertIn('deleted successfully', response_data['message'])
    
    def test_assign_mechanic_to_ticket(self):
        """Test assigning a mechanic to a service ticket."""
        customer = self.create_test_customer()
        ticket = self.create_test_ticket(customer.id)
        mechanic = self.create_test_mechanic()
        
        response = self.client.put(
            f'/service-tickets/{ticket.id}/assign-mechanic/{mechanic.id}'
        )
        
        self.assertEqual(response.status_code, 200)
        response_data = json.loads(response.data)
        self.assertIn('assigned', response_data['message'])
    
    def test_remove_mechanic_from_ticket(self):
        """Test removing a mechanic from a service ticket."""
        customer = self.create_test_customer()
        ticket = self.create_test_ticket(customer.id)
        mechanic = self.create_test_mechanic()
        
        # First assign the mechanic
        ticket.mechanics.append(mechanic)
        db.session.commit()
        
        # Then remove
        response = self.client.put(
            f'/service-tickets/{ticket.id}/remove-mechanic/{mechanic.id}'
        )
        
        self.assertEqual(response.status_code, 200)
        response_data = json.loads(response.data)
        self.assertIn('removed', response_data['message'])
    
    def test_get_tickets_by_customer(self):
        """Test retrieving all tickets for a specific customer."""
        customer = self.create_test_customer()
        self.create_test_ticket(customer.id)
        self.create_test_ticket(customer.id)
        
        response = self.client.get(f'/service-tickets/customer/{customer.id}')
        
        self.assertEqual(response.status_code, 200)
        response_data = json.loads(response.data)
        self.assertEqual(len(response_data), 2)
    
    def test_get_tickets_by_mechanic(self):
        """Test retrieving all tickets assigned to a specific mechanic."""
        customer = self.create_test_customer()
        ticket = self.create_test_ticket(customer.id)
        mechanic = self.create_test_mechanic()
        
        # Assign mechanic to ticket
        ticket.mechanics.append(mechanic)
        db.session.commit()
        
        response = self.client.get(f'/service-tickets/mechanic/{mechanic.id}')
        
        self.assertEqual(response.status_code, 200)
        response_data = json.loads(response.data)
        self.assertEqual(len(response_data), 1)
    
    def test_add_part_to_ticket(self):
        """Test adding an inventory part to a service ticket."""
        customer = self.create_test_customer()
        ticket = self.create_test_ticket(customer.id)
        inventory = self.create_test_inventory()
        
        response = self.client.put(
            f'/service-tickets/{ticket.id}/add-part/{inventory.id}'
        )
        
        self.assertEqual(response.status_code, 200)
        response_data = json.loads(response.data)
        self.assertIn('added', response_data['message'])
    
    # Negative Tests
    
    def test_create_ticket_missing_required_fields(self):
        """Test service ticket creation with missing required fields."""
        data = {
            'vehicle_make': 'Toyota'
            # Missing customer_id and description
        }
        
        response = self.client.post(
            '/service-tickets/',
            data=json.dumps(data),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 400)
        response_data = json.loads(response.data)
        self.assertIn('errors', response_data)
    
    def test_create_ticket_invalid_customer(self):
        """Test creating ticket with non-existent customer."""
        data = {
            'customer_id': 9999,
            'description': 'Test service'
        }
        
        response = self.client.post(
            '/service-tickets/',
            data=json.dumps(data),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 404)
        response_data = json.loads(response.data)
        self.assertIn('Customer not found', response_data['error'])
    
    def test_get_ticket_not_found(self):
        """Test retrieving non-existent ticket."""
        response = self.client.get('/service-tickets/9999')
        
        self.assertEqual(response.status_code, 404)
        response_data = json.loads(response.data)
        self.assertIn('not found', response_data['error'])
    
    def test_update_ticket_not_found(self):
        """Test updating non-existent ticket."""
        update_data = {'description': 'Updated'}
        
        response = self.client.put(
            '/service-tickets/9999',
            data=json.dumps(update_data),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 404)
    
    def test_delete_ticket_not_found(self):
        """Test deleting non-existent ticket."""
        response = self.client.delete('/service-tickets/9999')
        
        self.assertEqual(response.status_code, 404)
    
    def test_assign_mechanic_ticket_not_found(self):
        """Test assigning mechanic to non-existent ticket."""
        mechanic = self.create_test_mechanic()
        
        response = self.client.put(
            f'/service-tickets/9999/assign-mechanic/{mechanic.id}'
        )
        
        self.assertEqual(response.status_code, 404)
    
    def test_assign_nonexistent_mechanic(self):
        """Test assigning non-existent mechanic to ticket."""
        customer = self.create_test_customer()
        ticket = self.create_test_ticket(customer.id)
        
        response = self.client.put(
            f'/service-tickets/{ticket.id}/assign-mechanic/9999'
        )
        
        self.assertEqual(response.status_code, 404)
    
    def test_assign_mechanic_already_assigned(self):
        """Test assigning a mechanic who is already assigned."""
        customer = self.create_test_customer()
        ticket = self.create_test_ticket(customer.id)
        mechanic = self.create_test_mechanic()
        
        # Assign mechanic first time
        ticket.mechanics.append(mechanic)
        db.session.commit()
        
        # Try to assign again
        response = self.client.put(
            f'/service-tickets/{ticket.id}/assign-mechanic/{mechanic.id}'
        )
        
        self.assertEqual(response.status_code, 409)
        response_data = json.loads(response.data)
        self.assertIn('already assigned', response_data['error'])
    
    def test_remove_mechanic_not_assigned(self):
        """Test removing a mechanic who is not assigned."""
        customer = self.create_test_customer()
        ticket = self.create_test_ticket(customer.id)
        mechanic = self.create_test_mechanic()
        
        response = self.client.put(
            f'/service-tickets/{ticket.id}/remove-mechanic/{mechanic.id}'
        )
        
        self.assertEqual(response.status_code, 409)
        response_data = json.loads(response.data)
        self.assertIn('not assigned', response_data['error'])
    
    def test_get_tickets_customer_not_found(self):
        """Test getting tickets for non-existent customer."""
        response = self.client.get('/service-tickets/customer/9999')
        
        self.assertEqual(response.status_code, 404)
    
    def test_get_tickets_mechanic_not_found(self):
        """Test getting tickets for non-existent mechanic."""
        response = self.client.get('/service-tickets/mechanic/9999')
        
        self.assertEqual(response.status_code, 404)
    
    def test_add_part_ticket_not_found(self):
        """Test adding part to non-existent ticket."""
        inventory = self.create_test_inventory()
        
        response = self.client.put(
            f'/service-tickets/9999/add-part/{inventory.id}'
        )
        
        self.assertEqual(response.status_code, 404)
    
    def test_add_nonexistent_part_to_ticket(self):
        """Test adding non-existent part to ticket."""
        customer = self.create_test_customer()
        ticket = self.create_test_ticket(customer.id)
        
        response = self.client.put(
            f'/service-tickets/{ticket.id}/add-part/9999'
        )
        
        self.assertEqual(response.status_code, 404)
    
    def test_add_part_already_added(self):
        """Test adding a part that is already added."""
        customer = self.create_test_customer()
        ticket = self.create_test_ticket(customer.id)
        inventory = self.create_test_inventory()
        
        # Add part first time
        ticket.inventory_parts.append(inventory)
        db.session.commit()
        
        # Try to add again
        response = self.client.put(
            f'/service-tickets/{ticket.id}/add-part/{inventory.id}'
        )
        
        self.assertEqual(response.status_code, 409)
        response_data = json.loads(response.data)
        self.assertIn('already added', response_data['error'])


if __name__ == '__main__':
    unittest.main()
