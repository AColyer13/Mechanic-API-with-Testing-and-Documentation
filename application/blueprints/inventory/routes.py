"""Inventory routes for CRUD operations."""

from flask import request, jsonify
from marshmallow import ValidationError
from sqlalchemy.exc import IntegrityError
from flasgger import swag_from
from application.extensions import db, limiter, cache
from application.models import Inventory
from .schemas import inventory_schema, inventories_schema, inventory_simple_schema, inventories_simple_schema
from . import inventory_bp


@inventory_bp.route('/', methods=['POST'])
@limiter.limit("20 per minute")  # Rate limiting: max 20 inventory creations per minute
def create_inventory():
    """
    Create a new inventory part
    ---
    tags:
      - Inventory
    summary: Create a new inventory part
    description: Add a new part to the inventory system
    parameters:
      - in: body
        name: body
        required: true
        description: Inventory part information
        schema:
          id: InventoryCreate
          required:
            - name
            - price
          properties:
            name:
              type: string
              example: Oil Filter
            price:
              type: number
              format: float
              example: 12.99
    responses:
      201:
        description: Inventory part created successfully
        schema:
          id: InventoryResponse
          properties:
            id:
              type: integer
              example: 1
            name:
              type: string
              example: Oil Filter
            price:
              type: number
              example: 12.99
      400:
        description: Invalid input data
        schema:
          properties:
            errors:
              type: object
    """
    try:
        # Validate and deserialize input
        inventory_data = inventory_schema.load(request.json)
        
        # Save to database
        db.session.add(inventory_data)
        db.session.commit()
        
        # Clear the cache for all inventory list
        cache.delete('all_inventory')
        
        # Return serialized inventory
        return inventory_simple_schema.dump(inventory_data), 201
        
    except ValidationError as err:
        return {'errors': err.messages}, 400
    except Exception as e:
        db.session.rollback()
        return {'error': 'An error occurred while creating the inventory part'}, 500


@inventory_bp.route('/', methods=['GET'])
@cache.cached(timeout=300, key_prefix='all_inventory')  # Cache for 5 minutes
def get_inventory():
    """
    Retrieve all inventory parts
    ---
    tags:
      - Inventory
    summary: Get all inventory parts
    description: Retrieve a list of all parts in the inventory
    responses:
      200:
        description: List of all inventory parts
        schema:
          type: array
          items:
            type: object
            properties:
              id:
                type: integer
                example: 1
              name:
                type: string
                example: Oil Filter
              price:
                type: number
                example: 12.99
    """
    try:
        inventory_items = Inventory.query.all()
        return inventories_simple_schema.dump(inventory_items), 200
    except Exception as e:
        return {'error': 'An error occurred while retrieving inventory'}, 500


@inventory_bp.route('/<int:inventory_id>', methods=['GET'])
def get_inventory_item(inventory_id):
    """
    Retrieve a specific inventory part by ID
    ---
    tags:
      - Inventory
    summary: Get inventory part by ID
    description: Retrieve detailed information about a specific inventory part including associated service tickets
    parameters:
      - in: path
        name: inventory_id
        type: integer
        required: true
        description: The ID of the inventory part to retrieve
        example: 1
    responses:
      200:
        description: Inventory part details
        schema:
          type: object
          properties:
            id:
              type: integer
              example: 1
            name:
              type: string
              example: Oil Filter
            price:
              type: number
              example: 12.99
            service_tickets:
              type: array
              items:
                type: object
      404:
        description: Inventory part not found
        schema:
          properties:
            error:
              type: string
              example: Inventory part not found
    """
    try:
        inventory_item = Inventory.query.get(inventory_id)
        if not inventory_item:
            return {'error': 'Inventory part not found'}, 404
            
        return inventory_schema.dump(inventory_item), 200
    except Exception as e:
        return {'error': 'An error occurred while retrieving the inventory part'}, 500


@inventory_bp.route('/<int:inventory_id>', methods=['PUT'])
def update_inventory(inventory_id):
    """
    Update a specific inventory part
    ---
    tags:
      - Inventory
    summary: Update inventory part
    description: Update inventory part information
    parameters:
      - in: path
        name: inventory_id
        type: integer
        required: true
        description: The ID of the inventory part to update
        example: 1
      - in: body
        name: body
        required: true
        description: Updated inventory part information
        schema:
          properties:
            name:
              type: string
              example: Premium Oil Filter
            price:
              type: number
              example: 15.99
    responses:
      200:
        description: Inventory part updated successfully
        schema:
          type: object
          properties:
            id:
              type: integer
            name:
              type: string
            price:
              type: number
      400:
        description: Invalid input data
      404:
        description: Inventory part not found
    """
    try:
        inventory_item = Inventory.query.get(inventory_id)
        if not inventory_item:
            return {'error': 'Inventory part not found'}, 404
        
        # Validate and update inventory data
        inventory_data = inventory_schema.load(request.json, instance=inventory_item, partial=True)
        
        # Save changes
        db.session.commit()
        
        # Clear the cache
        cache.delete('all_inventory')
        
        return inventory_simple_schema.dump(inventory_data), 200
        
    except ValidationError as err:
        return {'errors': err.messages}, 400
    except Exception as e:
        db.session.rollback()
        return {'error': 'An error occurred while updating the inventory part'}, 500


@inventory_bp.route('/<int:inventory_id>', methods=['DELETE'])
def delete_inventory(inventory_id):
    """
    Delete a specific inventory part
    ---
    tags:
      - Inventory
    summary: Delete inventory part
    description: Delete an inventory part from the system (cannot delete if used in service tickets)
    parameters:
      - in: path
        name: inventory_id
        type: integer
        required: true
        description: The ID of the inventory part to delete
        example: 1
    responses:
      200:
        description: Inventory part deleted successfully
        schema:
          properties:
            message:
              type: string
              example: Inventory part 1 deleted successfully
      404:
        description: Inventory part not found
      409:
        description: Cannot delete inventory part that is used in service tickets
        schema:
          properties:
            error:
              type: string
              example: Cannot delete inventory part that is used in service tickets
    """
    try:
        inventory_item = Inventory.query.get(inventory_id)
        if not inventory_item:
            return {'error': 'Inventory part not found'}, 404
        
        # Check if inventory part is used in service tickets
        if inventory_item.service_tickets:
            return {'error': 'Cannot delete inventory part that is used in service tickets'}, 409
        
        db.session.delete(inventory_item)
        db.session.commit()
        
        # Clear the cache
        cache.delete('all_inventory')
        
        return {'message': f'Inventory part {inventory_id} deleted successfully'}, 200
        
    except Exception as e:
        db.session.rollback()
        return {'error': 'An error occurred while deleting the inventory part'}, 500
