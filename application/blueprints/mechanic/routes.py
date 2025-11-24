"""Mechanic routes for CRUD operations."""

from flask import request, jsonify
from marshmallow import ValidationError
from sqlalchemy.exc import IntegrityError
from flasgger import swag_from
from application.extensions import db, limiter, cache
from application.models import Mechanic
from .schemas import mechanic_schema, mechanics_schema, mechanic_simple_schema, mechanics_simple_schema
from . import mechanic_bp


@mechanic_bp.route('/', methods=['POST'])
@limiter.limit("10 per minute")  # Rate limiting: max 10 mechanic creations per minute
def create_mechanic():
    """
    Create a new mechanic
    ---
    tags:
      - Mechanics
    summary: Create a new mechanic
    description: Add a new mechanic to the system
    parameters:
      - in: body
        name: body
        required: true
        description: Mechanic information
        schema:
          id: MechanicCreate
          required:
            - first_name
            - last_name
            - email
          properties:
            first_name:
              type: string
              example: Mike
            last_name:
              type: string
              example: Smith
            email:
              type: string
              format: email
              example: mike.smith@mechanicshop.com
            phone:
              type: string
              example: 555-9876
            specialty:
              type: string
              example: Engine Repair
            hourly_rate:
              type: number
              format: float
              example: 85.50
            hire_date:
              type: string
              format: date
              example: 2024-01-15
    responses:
      201:
        description: Mechanic created successfully
        schema:
          id: MechanicResponse
          properties:
            id:
              type: integer
              example: 1
            first_name:
              type: string
              example: Mike
            last_name:
              type: string
              example: Smith
            email:
              type: string
              example: mike.smith@mechanicshop.com
            phone:
              type: string
              example: 555-9876
            specialty:
              type: string
              example: Engine Repair
            hourly_rate:
              type: number
              example: 85.50
      400:
        description: Invalid input data
        schema:
          properties:
            errors:
              type: object
      409:
        description: Mechanic with this email already exists
        schema:
          properties:
            error:
              type: string
              example: Mechanic with this email already exists
    """
    try:
        # Validate and deserialize input
        mechanic_data = mechanic_schema.load(request.json)
        
        # Save to database
        db.session.add(mechanic_data)
        db.session.commit()
        
        # Clear the cache for all mechanics list
        cache.delete('all_mechanics')
        
        # Return serialized mechanic
        return mechanic_simple_schema.dump(mechanic_data), 201
        
    except ValidationError as err:
        return {'errors': err.messages}, 400
    except IntegrityError:
        db.session.rollback()
        return {'error': 'Mechanic with this email already exists'}, 409
    except Exception as e:
        db.session.rollback()
        return {'error': 'An error occurred while creating the mechanic'}, 500


@mechanic_bp.route('/', methods=['GET'])
@cache.cached(timeout=300, key_prefix='all_mechanics')  # Cache for 5 minutes
def get_mechanics():
    """
    Retrieve all mechanics
    ---
    tags:
      - Mechanics
    summary: Get all mechanics
    description: Retrieve a list of all mechanics in the system
    responses:
      200:
        description: List of all mechanics
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
                example: Mike
              last_name:
                type: string
                example: Smith
              email:
                type: string
                example: mike.smith@mechanicshop.com
              phone:
                type: string
                example: 555-9876
              specialty:
                type: string
                example: Engine Repair
              hourly_rate:
                type: number
                example: 85.50
    """
    try:
        mechanics = Mechanic.query.all()
        return mechanics_simple_schema.dump(mechanics), 200
    except Exception as e:
        return {'error': 'An error occurred while retrieving mechanics'}, 500



@mechanic_bp.route('/<int:mechanic_id>', methods=['GET'])
def get_mechanic(mechanic_id):
    """
    Retrieve a specific mechanic by ID
    ---
    tags:
      - Mechanics
    summary: Get mechanic by ID
    description: Retrieve detailed information about a specific mechanic including assigned service tickets
    parameters:
      - in: path
        name: mechanic_id
        type: integer
        required: true
        description: The ID of the mechanic to retrieve
        example: 1
    responses:
      200:
        description: Mechanic details
        schema:
          type: object
          properties:
            id:
              type: integer
              example: 1
            first_name:
              type: string
              example: Mike
            last_name:
              type: string
              example: Smith
            email:
              type: string
              example: mike.smith@mechanicshop.com
            phone:
              type: string
              example: 555-9876
            specialty:
              type: string
              example: Engine Repair
            hourly_rate:
              type: number
              example: 85.50
            service_tickets:
              type: array
              items:
                type: object
      404:
        description: Mechanic not found
        schema:
          properties:
            error:
              type: string
              example: Mechanic not found
    """
    try:
        mechanic = Mechanic.query.get(mechanic_id)
        if not mechanic:
            return {'error': 'Mechanic not found'}, 404
            
        return mechanic_schema.dump(mechanic), 200
    except Exception as e:
        return {'error': 'An error occurred while retrieving the mechanic'}, 500


@mechanic_bp.route('/<int:mechanic_id>', methods=['PUT'])
def update_mechanic(mechanic_id):
    """
    Update a specific mechanic
    ---
    tags:
      - Mechanics
    summary: Update mechanic information
    description: Update mechanic details
    parameters:
      - in: path
        name: mechanic_id
        type: integer
        required: true
        description: The ID of the mechanic to update
        example: 1
      - in: body
        name: body
        required: true
        description: Updated mechanic information
        schema:
          properties:
            first_name:
              type: string
              example: Mike
            last_name:
              type: string
              example: Smith
            email:
              type: string
              example: mike.smith@mechanicshop.com
            phone:
              type: string
              example: 555-9876
            specialty:
              type: string
              example: Transmission Specialist
            hourly_rate:
              type: number
              example: 95.00
    responses:
      200:
        description: Mechanic updated successfully
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
      404:
        description: Mechanic not found
      409:
        description: Email already exists
    """
    try:
        mechanic = Mechanic.query.get(mechanic_id)
        if not mechanic:
            return {'error': 'Mechanic not found'}, 404
        
        # Validate and update mechanic data
        mechanic_data = mechanic_schema.load(request.json, instance=mechanic, partial=True)
        
        # Save changes
        db.session.commit()
        
        # Clear the cached list of all mechanics
        cache.delete('all_mechanics')
        
        return mechanic_simple_schema.dump(mechanic_data), 200
        
    except ValidationError as err:
        return {'errors': err.messages}, 400
    except IntegrityError:
        db.session.rollback()
        return {'error': 'Mechanic with this email already exists'}, 409
    except Exception as e:
        db.session.rollback()
        return {'error': 'An error occurred while updating the mechanic'}, 500


@mechanic_bp.route('/<int:mechanic_id>', methods=['DELETE'])
def delete_mechanic(mechanic_id):
    """
    Delete a specific mechanic
    ---
    tags:
      - Mechanics
    summary: Delete mechanic
    description: Delete a mechanic from the system (cannot delete if assigned to service tickets)
    parameters:
      - in: path
        name: mechanic_id
        type: integer
        required: true
        description: The ID of the mechanic to delete
        example: 1
    responses:
      200:
        description: Mechanic deleted successfully
        schema:
          properties:
            message:
              type: string
              example: Mechanic 1 deleted successfully
      404:
        description: Mechanic not found
      409:
        description: Cannot delete mechanic who is assigned to service tickets
        schema:
          properties:
            error:
              type: string
              example: Cannot delete mechanic who is assigned to service tickets
    """
    try:
        mechanic = Mechanic.query.get(mechanic_id)
        if not mechanic:
            return {'error': 'Mechanic not found'}, 404
        
        # Check if mechanic is assigned to any service tickets
        from application.models import mechanic_service_ticket
        ticket_count = db.session.query(mechanic_service_ticket).filter_by(mechanic_id=mechanic_id).count()
        if ticket_count > 0:
            return {'error': 'Cannot delete mechanic who is assigned to service tickets'}, 409
        
        db.session.delete(mechanic)
        db.session.commit()
        
        # Clear the cached list of all mechanics
        cache.delete('all_mechanics')
        
        return {'message': f'Mechanic {mechanic_id} deleted successfully'}, 200
        
    except Exception as e:
        db.session.rollback()
        return {'error': 'An error occurred while deleting the mechanic'}, 500