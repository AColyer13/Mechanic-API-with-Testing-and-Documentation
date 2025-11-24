"""Customer routes for CRUD operations."""

from flask import request, jsonify
from marshmallow import ValidationError
from sqlalchemy.exc import IntegrityError
from flasgger import swag_from
import bcrypt
from application.extensions import db, limiter, cache, encode_token, token_required
from application.models import Customer, ServiceTicket
from .customerSchemas import customer_schema, customers_schema, customer_simple_schema, customers_simple_schema, login_schema
from . import customer_bp


@customer_bp.route('/login', methods=['POST'])
def login():
    """
    Customer login endpoint - returns JWT token
    ---
    tags:
      - Customers
    summary: Customer login
    description: Authenticate a customer and receive a JWT token for protected routes
    parameters:
      - in: body
        name: body
        required: true
        description: Customer login credentials
        schema:
          id: LoginCredentials
          required:
            - email
            - password
          properties:
            email:
              type: string
              format: email
              example: john.doe@email.com
            password:
              type: string
              format: password
              example: SecurePassword123
    responses:
      200:
        description: Login successful
        schema:
          id: LoginResponse
          properties:
            message:
              type: string
              example: Login successful
            token:
              type: string
              example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
            customer:
              type: object
              properties:
                id:
                  type: integer
                  example: 1
                first_name:
                  type: string
                  example: John
                last_name:
                  type: string
                  example: Doe
                email:
                  type: string
                  example: john.doe@email.com
                phone:
                  type: string
                  example: 555-1234
                address:
                  type: string
                  example: 123 Main St
      400:
        description: Invalid input
        schema:
          properties:
            errors:
              type: object
      401:
        description: Invalid credentials
        schema:
          properties:
            error:
              type: string
              example: Invalid email or password
    """
    try:
        # Validate input
        credentials = login_schema.load(request.json)
        
        # Find customer by email
        customer = Customer.query.filter_by(email=credentials['email']).first()
        
        if not customer:
            return {'error': 'Invalid email or password'}, 401
        
        # Verify password
        password_bytes = credentials['password'].encode('utf-8')
        stored_hash = customer.password.encode('utf-8')
        if not bcrypt.checkpw(password_bytes, stored_hash):
            return {'error': 'Invalid email or password'}, 401
        
        # Generate token
        token = encode_token(customer.id)
        
        return {
            'message': 'Login successful',
            'token': token,
            'customer': customer_simple_schema.dump(customer)
        }, 200
        
    except ValidationError as err:
        return {'errors': err.messages}, 400
    except Exception as e:
        return {'error': 'An error occurred during login'}, 500


@customer_bp.route('/my-tickets', methods=['GET'])
@token_required
def get_my_tickets(customer_id):
    """
    Get service tickets for the authenticated customer
    ---
    tags:
      - Customers
    summary: Get my service tickets
    description: Retrieve all service tickets for the authenticated customer (requires Bearer token)
    security:
      - bearerAuth: []
    responses:
      200:
        description: List of customer's service tickets
        schema:
          type: array
          items:
            type: object
            properties:
              id:
                type: integer
                example: 1
              customer_id:
                type: integer
                example: 1
              vehicle_year:
                type: integer
                example: 2020
              vehicle_make:
                type: string
                example: Toyota
              vehicle_model:
                type: string
                example: Camry
              vehicle_vin:
                type: string
                example: 1HGBH41JXMN109186
              description:
                type: string
                example: Oil change and tire rotation
              estimated_cost:
                type: number
                format: float
                example: 150.00
              actual_cost:
                type: number
                format: float
                example: 145.50
              status:
                type: string
                example: Open
              created_at:
                type: string
                format: date-time
              completed_at:
                type: string
                format: date-time
      401:
        description: Unauthorized - Invalid or missing token
        schema:
          properties:
            error:
              type: string
              example: Token is missing or invalid
    """
    try:
        # Query service tickets for this customer
        tickets = ServiceTicket.query.filter_by(customer_id=customer_id).all()
        
        # Import schema here to avoid circular import
        from application.blueprints.service_ticket.schemas import service_tickets_schema
        
        return service_tickets_schema.dump(tickets), 200
        
    except Exception as e:
        return {'error': 'An error occurred while retrieving tickets'}, 500


@customer_bp.route('/', methods=['POST'])
@limiter.limit("10 per minute")  # Rate limiting: max 10 customer creations per minute
def create_customer():
    """
    Create a new customer
    ---
    tags:
      - Customers
    summary: Create a new customer
    description: Register a new customer account with hashed password
    parameters:
      - in: body
        name: body
        required: true
        description: Customer information
        schema:
          id: CustomerCreate
          required:
            - first_name
            - last_name
            - email
            - password
          properties:
            first_name:
              type: string
              example: John
            last_name:
              type: string
              example: Doe
            email:
              type: string
              format: email
              example: john.doe@email.com
            password:
              type: string
              format: password
              example: SecurePassword123
            phone:
              type: string
              example: 555-1234
            address:
              type: string
              example: 123 Main St, City, State 12345
    responses:
      201:
        description: Customer created successfully
        schema:
          id: CustomerResponse
          properties:
            id:
              type: integer
              example: 1
            first_name:
              type: string
              example: John
            last_name:
              type: string
              example: Doe
            email:
              type: string
              example: john.doe@email.com
            phone:
              type: string
              example: 555-1234
            address:
              type: string
              example: 123 Main St, City, State 12345
      400:
        description: Invalid input data
        schema:
          properties:
            errors:
              type: object
      409:
        description: Customer with this email already exists
        schema:
          properties:
            error:
              type: string
              example: Customer with this email already exists
    """
    try:
        # Validate and deserialize input
        customer_data = customer_schema.load(request.json)
        
        # Save to database
        db.session.add(customer_data)
        db.session.commit()
        
        # Clear the cache for all customers list
        cache.delete('all_customers')
        
        # Return serialized customer
        return customer_simple_schema.dump(customer_data), 201
        
    except ValidationError as err:
        return {'errors': err.messages}, 400
    except IntegrityError:
        db.session.rollback()
        return {'error': 'Customer with this email already exists'}, 409
    except Exception as e:
        db.session.rollback()
        return {'error': 'An error occurred while creating the customer'}, 500


@customer_bp.route('/', methods=['GET'])
@cache.cached(timeout=300, key_prefix='all_customers')  # Cache for 5 minutes
def get_customers():
    """
    Retrieve all customers
    ---
    tags:
      - Customers
    summary: Get all customers
    description: Retrieve a list of all registered customers
    responses:
      200:
        description: List of all customers
        schema:
          type: array
          items:
            type: object
            properties:
              id:
                type: integer
                example: 1
              first_name:
                type: string
                example: John
              last_name:
                type: string
                example: Doe
              email:
                type: string
                example: john.doe@email.com
              phone:
                type: string
                example: 555-1234
              address:
                type: string
                example: 123 Main St
    """
    try:
        customers = Customer.query.all()
        return customers_simple_schema.dump(customers), 200
    except Exception as e:
        return {'error': 'An error occurred while retrieving customers'}, 500


@customer_bp.route('/<int:customer_id>', methods=['GET'])
def get_customer(customer_id):
    """
    Retrieve a specific customer by ID
    ---
    tags:
      - Customers
    summary: Get customer by ID
    description: Retrieve detailed information about a specific customer
    parameters:
      - in: path
        name: customer_id
        type: integer
        required: true
        description: The ID of the customer to retrieve
        example: 1
    responses:
      200:
        description: Customer details
        schema:
          type: object
          properties:
            id:
              type: integer
              example: 1
            first_name:
              type: string
              example: John
            last_name:
              type: string
              example: Doe
            email:
              type: string
              example: john.doe@email.com
            phone:
              type: string
              example: 555-1234
            address:
              type: string
              example: 123 Main St
            service_tickets:
              type: array
              items:
                type: object
      404:
        description: Customer not found
        schema:
          properties:
            error:
              type: string
              example: Customer not found
    """
    try:
        customer = Customer.query.get(customer_id)
        if not customer:
            return {'error': 'Customer not found'}, 404
            
        return customer_schema.dump(customer), 200
    except Exception as e:
        return {'error': 'An error occurred while retrieving the customer'}, 500


@customer_bp.route('/<int:customer_id>', methods=['PUT'])
@token_required
def update_customer(authenticated_customer_id, customer_id):
    """
    Update a specific customer
    ---
    tags:
      - Customers
    summary: Update customer account
    description: Update customer information (requires Bearer token, customers can only update their own account)
    security:
      - bearerAuth: []
    parameters:
      - in: path
        name: customer_id
        type: integer
        required: true
        description: The ID of the customer to update
        example: 1
      - in: body
        name: body
        required: true
        description: Updated customer information
        schema:
          properties:
            first_name:
              type: string
              example: John
            last_name:
              type: string
              example: Doe
            email:
              type: string
              example: john.doe@email.com
            password:
              type: string
              example: NewPassword123
            phone:
              type: string
              example: 555-5678
            address:
              type: string
              example: 456 Oak Ave
    responses:
      200:
        description: Customer updated successfully
        schema:
          type: object
          properties:
            id:
              type: integer
            first_name:
              type: string
            last_name:
              type: string
            email:
              type: string
      400:
        description: Invalid input data
      403:
        description: Forbidden - Can only update own account
        schema:
          properties:
            error:
              type: string
              example: You can only update your own account
      404:
        description: Customer not found
      409:
        description: Email already exists
    """
    try:
        # Ensure customer can only update their own account
        if authenticated_customer_id != customer_id:
            return {'error': 'You can only update your own account'}, 403
        
        customer = Customer.query.get(customer_id)
        if not customer:
            return {'error': 'Customer not found'}, 404
        
        # Validate and update customer data
        customer_data = customer_schema.load(request.json, instance=customer, partial=True)
        
        # Save changes
        db.session.commit()
        
        # Clear the cached list of all customers
        cache.delete('all_customers')
        
        return customer_simple_schema.dump(customer_data), 200
        
    except ValidationError as err:
        return {'errors': err.messages}, 400
    except IntegrityError:
        db.session.rollback()
        return {'error': 'Customer with this email already exists'}, 409
    except Exception as e:
        db.session.rollback()
        return {'error': 'An error occurred while updating the customer'}, 500


@customer_bp.route('/<int:customer_id>', methods=['DELETE'])
@token_required
def delete_customer(authenticated_customer_id, customer_id):
    """
    Delete a specific customer
    ---
    tags:
      - Customers
    summary: Delete customer account
    description: Delete a customer account (requires Bearer token, customers can only delete their own account)
    security:
      - bearerAuth: []
    parameters:
      - in: path
        name: customer_id
        type: integer
        required: true
        description: The ID of the customer to delete
        example: 1
    responses:
      200:
        description: Customer deleted successfully
        schema:
          properties:
            message:
              type: string
              example: Customer 1 deleted successfully
      403:
        description: Forbidden - Can only delete own account
        schema:
          properties:
            error:
              type: string
              example: You can only delete your own account
      404:
        description: Customer not found
      409:
        description: Cannot delete customer with active service tickets
        schema:
          properties:
            error:
              type: string
              example: Cannot delete customer with active service tickets
    """
    try:
        # Ensure customer can only delete their own account
        if authenticated_customer_id != customer_id:
            return {'error': 'You can only delete your own account'}, 403
        
        customer = Customer.query.get(customer_id)
        if not customer:
            return {'error': 'Customer not found'}, 404
        
        # Check if customer has service tickets
        from application.models import ServiceTicket
        ticket_count = ServiceTicket.query.filter_by(customer_id=customer_id).count()
        if ticket_count > 0:
            return {'error': 'Cannot delete customer with active service tickets'}, 409
        
        db.session.delete(customer)
        db.session.commit()
        
        # Clear the cached list of all customers
        cache.delete('all_customers')
        
        return {'message': f'Customer {customer_id} deleted successfully'}, 200
        
    except Exception as e:
        db.session.rollback()
        return {'error': 'An error occurred while deleting the customer'}, 500