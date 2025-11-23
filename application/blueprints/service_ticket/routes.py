"""Service ticket routes for CRUD operations and mechanic assignment."""

from flask import request, jsonify
from marshmallow import ValidationError
from sqlalchemy.exc import IntegrityError
from datetime import datetime
from flasgger import swag_from
from application.extensions import db
from application.models import ServiceTicket, Customer, Mechanic, Inventory
from .schemas import (service_ticket_schema, service_tickets_schema, 
                     service_ticket_simple_schema, service_tickets_simple_schema)
from . import service_ticket_bp


@service_ticket_bp.route('/', methods=['POST'])
def create_service_ticket():
    """
    Create a new service ticket
    ---
    tags:
      - Service Tickets
    summary: Create a new service ticket
    description: Create a new service ticket for a customer's vehicle
    parameters:
      - in: body
        name: body
        required: true
        description: Service ticket information
        schema:
          id: ServiceTicketCreate
          required:
            - customer_id
            - description
          properties:
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
              example: Oil change and tire rotation needed
            estimated_cost:
              type: number
              format: float
              example: 150.00
            status:
              type: string
              example: Open
    responses:
      201:
        description: Service ticket created successfully
        schema:
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
            description:
              type: string
              example: Oil change and tire rotation needed
            status:
              type: string
              example: Open
      400:
        description: Invalid input data
      404:
        description: Customer not found
    """
    try:
        # Validate and deserialize input
        ticket_data = service_ticket_schema.load(request.json)
        
        # Verify customer exists
        customer = Customer.query.get(ticket_data.customer_id)
        if not customer:
            return {'error': 'Customer not found'}, 404
        
        # Save to database
        db.session.add(ticket_data)
        db.session.commit()
        
        # Return serialized ticket
        return service_ticket_schema.dump(ticket_data), 201
        
    except ValidationError as err:
        return {'errors': err.messages}, 400
    except Exception as e:
        db.session.rollback()
        return {'error': 'An error occurred while creating the service ticket'}, 500


@service_ticket_bp.route('/', methods=['GET'])
def get_service_tickets():
    """
    Retrieve all service tickets
    ---
    tags:
      - Service Tickets
    summary: Get all service tickets
    description: Retrieve a list of all service tickets in the system
    responses:
      200:
        description: List of all service tickets
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
              description:
                type: string
                example: Oil change
              status:
                type: string
                example: Open
              created_at:
                type: string
                format: date-time
    """
    try:
        tickets = ServiceTicket.query.all()
        return service_tickets_schema.dump(tickets), 200
    except Exception as e:
        return {'error': 'An error occurred while retrieving service tickets'}, 500


@service_ticket_bp.route('/<int:ticket_id>', methods=['GET'])
def get_service_ticket(ticket_id):
    """
    Retrieve a specific service ticket by ID
    ---
    tags:
      - Service Tickets
    summary: Get service ticket by ID
    description: Retrieve detailed information about a specific service ticket including assigned mechanics and parts
    parameters:
      - in: path
        name: ticket_id
        type: integer
        required: true
        description: The ID of the service ticket to retrieve
        example: 1
    responses:
      200:
        description: Service ticket details
        schema:
          type: object
          properties:
            id:
              type: integer
            customer_id:
              type: integer
            vehicle_year:
              type: integer
            vehicle_make:
              type: string
            vehicle_model:
              type: string
            vehicle_vin:
              type: string
            description:
              type: string
            estimated_cost:
              type: number
            actual_cost:
              type: number
            status:
              type: string
            mechanics:
              type: array
              items:
                type: object
            inventory_parts:
              type: array
              items:
                type: object
      404:
        description: Service ticket not found
    """
    try:
        ticket = ServiceTicket.query.get(ticket_id)
        if not ticket:
            return {'error': 'Service ticket not found'}, 404
            
        return service_ticket_schema.dump(ticket), 200
    except Exception as e:
        return {'error': 'An error occurred while retrieving the service ticket'}, 500


@service_ticket_bp.route('/<int:ticket_id>', methods=['PUT'])
def update_service_ticket(ticket_id):
    """
    Update a specific service ticket
    ---
    tags:
      - Service Tickets
    summary: Update service ticket
    description: Update service ticket information including status and costs
    parameters:
      - in: path
        name: ticket_id
        type: integer
        required: true
        description: The ID of the service ticket to update
        example: 1
      - in: body
        name: body
        required: true
        description: Updated service ticket information
        schema:
          properties:
            description:
              type: string
              example: Oil change and tire rotation completed
            estimated_cost:
              type: number
              example: 150.00
            actual_cost:
              type: number
              example: 145.50
            status:
              type: string
              example: Completed
              enum: [Open, In Progress, Completed, Cancelled]
    responses:
      200:
        description: Service ticket updated successfully
      400:
        description: Invalid input data
      404:
        description: Service ticket not found
    """
    try:
        ticket = ServiceTicket.query.get(ticket_id)
        if not ticket:
            return {'error': 'Service ticket not found'}, 404
        
        # Get the current status before update
        old_status = ticket.status
        
        # Validate and update ticket data
        ticket_data = service_ticket_schema.load(request.json, instance=ticket, partial=True)
        
        # Handle status change to completed
        if hasattr(ticket_data, 'status') and ticket_data.status == 'Completed' and old_status != 'Completed':
            ticket_data.completed_at = datetime.utcnow()
        # Clear completed_at if status changes away from Completed
        elif hasattr(ticket_data, 'status') and ticket_data.status != 'Completed' and old_status == 'Completed':
            ticket_data.completed_at = None
        
        # Save changes
        db.session.commit()
        
        return service_ticket_schema.dump(ticket_data), 200
        
    except ValidationError as err:
        return {'errors': err.messages}, 400
    except Exception as e:
        db.session.rollback()
        return {'error': 'An error occurred while updating the service ticket'}, 500


@service_ticket_bp.route('/<int:ticket_id>', methods=['DELETE'])
def delete_service_ticket(ticket_id):
    """
    Delete a specific service ticket
    ---
    tags:
      - Service Tickets
    summary: Delete service ticket
    description: Remove a service ticket from the system
    parameters:
      - in: path
        name: ticket_id
        type: integer
        required: true
        description: The ID of the service ticket to delete
        example: 1
    responses:
      200:
        description: Service ticket deleted successfully
        schema:
          properties:
            message:
              type: string
              example: Service ticket 1 deleted successfully
      404:
        description: Service ticket not found
    """
    try:
        ticket = ServiceTicket.query.get(ticket_id)
        if not ticket:
            return {'error': 'Service ticket not found'}, 404
        
        db.session.delete(ticket)
        db.session.commit()
        
        return {'message': f'Service ticket {ticket_id} deleted successfully'}, 200
        
    except Exception as e:
        db.session.rollback()
        return {'error': 'An error occurred while deleting the service ticket'}, 500


@service_ticket_bp.route('/<int:ticket_id>/assign-mechanic/<int:mechanic_id>', methods=['PUT'])
def assign_mechanic(ticket_id, mechanic_id):
    """
    Assign a mechanic to a service ticket
    ---
    tags:
      - Service Tickets
    summary: Assign mechanic to ticket
    description: Assign a mechanic to work on a service ticket
    parameters:
      - in: path
        name: ticket_id
        type: integer
        required: true
        description: The ID of the service ticket
        example: 1
      - in: path
        name: mechanic_id
        type: integer
        required: true
        description: The ID of the mechanic to assign
        example: 1
    responses:
      200:
        description: Mechanic assigned successfully
        schema:
          properties:
            message:
              type: string
              example: Mechanic 1 assigned to ticket 1
      404:
        description: Service ticket or mechanic not found
      409:
        description: Mechanic is already assigned to this ticket
    """
    try:
        ticket = ServiceTicket.query.get(ticket_id)
        if not ticket:
            return {'error': 'Service ticket not found'}, 404
        
        mechanic = Mechanic.query.get(mechanic_id)
        if not mechanic:
            return {'error': 'Mechanic not found'}, 404
        
        # Check if mechanic is already assigned
        if mechanic in ticket.mechanics:
            return {'error': 'Mechanic is already assigned to this ticket'}, 409
        
        # Assign mechanic
        ticket.mechanics.append(mechanic)
        db.session.commit()
        
        return {'message': f'Mechanic {mechanic_id} assigned to ticket {ticket_id}'}, 200
        
    except Exception as e:
        db.session.rollback()
        return {'error': 'An error occurred while assigning the mechanic'}, 500


@service_ticket_bp.route('/<int:ticket_id>/remove-mechanic/<int:mechanic_id>', methods=['PUT'])
def remove_mechanic(ticket_id, mechanic_id):
    """
    Remove a mechanic from a service ticket
    ---
    tags:
      - Service Tickets
    summary: Remove mechanic from ticket
    description: Remove a mechanic assignment from a service ticket
    parameters:
      - in: path
        name: ticket_id
        type: integer
        required: true
        description: The ID of the service ticket
        example: 1
      - in: path
        name: mechanic_id
        type: integer
        required: true
        description: The ID of the mechanic to remove
        example: 1
    responses:
      200:
        description: Mechanic removed successfully
        schema:
          properties:
            message:
              type: string
              example: Mechanic 1 removed from ticket 1
      404:
        description: Service ticket or mechanic not found
      409:
        description: Mechanic is not assigned to this ticket
    """
    try:
        ticket = ServiceTicket.query.get(ticket_id)
        if not ticket:
            return {'error': 'Service ticket not found'}, 404
        
        mechanic = Mechanic.query.get(mechanic_id)
        if not mechanic:
            return {'error': 'Mechanic not found'}, 404
        
        # Check if mechanic is assigned
        if mechanic not in ticket.mechanics:
            return {'error': 'Mechanic is not assigned to this ticket'}, 409
        
        # Remove mechanic
        ticket.mechanics.remove(mechanic)
        db.session.commit()
        
        return {'message': f'Mechanic {mechanic_id} removed from ticket {ticket_id}'}, 200
        
    except Exception as e:
        db.session.rollback()
        return {'error': 'An error occurred while removing the mechanic'}, 500


@service_ticket_bp.route('/customer/<int:customer_id>', methods=['GET'])
def get_tickets_by_customer(customer_id):
    """
    Get all service tickets for a specific customer
    ---
    tags:
      - Service Tickets
    summary: Get tickets by customer
    description: Retrieve all service tickets associated with a specific customer
    parameters:
      - in: path
        name: customer_id
        type: integer
        required: true
        description: The ID of the customer
        example: 1
    responses:
      200:
        description: List of customer's service tickets
        schema:
          type: array
          items:
            type: object
      404:
        description: Customer not found
    """
    try:
        customer = Customer.query.get(customer_id)
        if not customer:
            return {'error': 'Customer not found'}, 404
        
        tickets = ServiceTicket.query.filter_by(customer_id=customer_id).all()
        return service_tickets_schema.dump(tickets), 200
        
    except Exception as e:
        return {'error': 'An error occurred while retrieving customer tickets'}, 500


@service_ticket_bp.route('/mechanic/<int:mechanic_id>', methods=['GET'])
def get_tickets_by_mechanic(mechanic_id):
    """
    Get all service tickets assigned to a specific mechanic
    ---
    tags:
      - Service Tickets
    summary: Get tickets by mechanic
    description: Retrieve all service tickets assigned to a specific mechanic
    parameters:
      - in: path
        name: mechanic_id
        type: integer
        required: true
        description: The ID of the mechanic
        example: 1
    responses:
      200:
        description: List of mechanic's service tickets
        schema:
          type: array
          items:
            type: object
      404:
        description: Mechanic not found
    """
    try:
        mechanic = Mechanic.query.get(mechanic_id)
        if not mechanic:
            return {'error': 'Mechanic not found'}, 404
        
        from application.models import ServiceTicket, mechanic_service_ticket
        tickets = ServiceTicket.query.join(mechanic_service_ticket).filter(mechanic_service_ticket.c.mechanic_id == mechanic_id).all()
        return service_tickets_schema.dump(tickets), 200
        
    except Exception as e:
        return {'error': 'An error occurred while retrieving mechanic tickets'}, 500


@service_ticket_bp.route('/<int:ticket_id>/add-part/<int:inventory_id>', methods=['PUT'])
def add_part_to_ticket(ticket_id, inventory_id):
    """
    Add a single inventory part to an existing service ticket
    ---
    tags:
      - Service Tickets
    summary: Add part to service ticket
    description: Add an inventory part to a service ticket
    parameters:
      - in: path
        name: ticket_id
        type: integer
        required: true
        description: The ID of the service ticket
        example: 1
      - in: path
        name: inventory_id
        type: integer
        required: true
        description: The ID of the inventory part to add
        example: 1
    responses:
      200:
        description: Part added successfully
        schema:
          properties:
            message:
              type: string
              example: Part 1 added to ticket 1
      404:
        description: Service ticket or inventory part not found
      409:
        description: Part is already added to this ticket
    """
    try:
        ticket = ServiceTicket.query.get(ticket_id)
        if not ticket:
            return {'error': 'Service ticket not found'}, 404
        
        inventory_part = Inventory.query.get(inventory_id)
        if not inventory_part:
            return {'error': 'Inventory part not found'}, 404
        
        # Check if part is already added
        if inventory_part in ticket.inventory_parts:
            return {'error': 'Part is already added to this ticket'}, 409
        
        # Add part to ticket
        ticket.inventory_parts.append(inventory_part)
        db.session.commit()
        
        return {'message': f'Part {inventory_id} added to ticket {ticket_id}'}, 200
        
    except Exception as e:
        db.session.rollback()
        return {'error': 'An error occurred while adding the part'}, 500