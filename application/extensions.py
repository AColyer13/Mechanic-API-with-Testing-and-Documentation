"""Extensions module for Flask app."""

from flask_sqlalchemy import SQLAlchemy
from flask_marshmallow import Marshmallow
from flask_migrate import Migrate
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_caching import Cache
from jose import jwt, JWTError
from datetime import datetime, timedelta
from functools import wraps
from flask import request, jsonify, current_app
import os

# Initialize extensions
db = SQLAlchemy()
ma = Marshmallow()
migrate = Migrate()
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour"]
)
cache = Cache()

# JWT Token Functions
ALGORITHM = "HS256"
TOKEN_EXPIRATION_HOURS = 24
SECRET_KEY = os.environ.get('SECRET_KEY') or "super secret secrets"

def encode_token(customer_id):
    """
    Creates a JWT token for a specific customer.
    
    Args:
        customer_id (int): The ID of the customer
        
    Returns:
        str: JWT token string
    """
    payload = {
        'exp': datetime.utcnow() + timedelta(hours=TOKEN_EXPIRATION_HOURS),
        'iat': datetime.utcnow(),
        'sub': str(customer_id)  # Convert to string for JWT
    }
    
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

def token_required(f):
    """
    Decorator that validates JWT token and extracts customer_id.
    
    The decorated function will receive customer_id as its first argument.
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        
        # Check for token in Authorization header
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            try:
                # Expected format: "Bearer <token>"
                token = auth_header.split(' ')[1]
            except IndexError:
                return jsonify({'message': 'Token format invalid. Expected: Bearer <token>'}), 401
        
        if not token:
            return jsonify({'message': 'Token is missing'}), 401
        
        try:
            # Decode the token
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            customer_id = int(payload['sub'])  # Convert back to integer
        except JWTError as e:
            return jsonify({'message': f'Token is invalid: {str(e)}'}), 401
        
        # Pass customer_id as first argument to the decorated function
        return f(customer_id, *args, **kwargs)
    
    return decorated