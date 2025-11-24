"""Application factory for the Mechanic Shop API."""

from flask import Flask
from flask_cors import CORS
from config import config
from application.extensions import db, ma, migrate, limiter, cache
from flask_swagger_ui import get_swaggerui_blueprint

# Swagger UI configuration
SWAGGER_URL = '/api/docs'  # URL for exposing Swagger UI (without trailing '/')
API_URL = '/static/swagger.yaml'  # Our API URL (can of course be a local resource)

swaggerui_blueprint = get_swaggerui_blueprint(
    SWAGGER_URL,
    API_URL,
    config={
        'app_name': "Mechanic Shop API"
    }
)

def create_app(config_name='development'):
    """Create and configure the Flask application."""
    app = Flask(__name__)
    
    # Load configuration
    app.config.from_object(config[config_name])
    
    # Enable CORS for all routes with comprehensive settings
    CORS(app, 
         resources={r"/*": {"origins": "*"}},
         supports_credentials=True,
         allow_headers=["Content-Type", "Authorization"],
         methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"]
    )
    
    # Add caching configuration
    app.config['CACHE_TYPE'] = 'SimpleCache'
    app.config['CACHE_DEFAULT_TIMEOUT'] = 300
    
    # Initialize extensions
    db.init_app(app)
    ma.init_app(app)
    migrate.init_app(app, db)
    limiter.init_app(app)
    cache.init_app(app)
    
    # Register blueprints
    from application.blueprints.customer import customer_bp
    from application.blueprints.mechanic import mechanic_bp
    from application.blueprints.service_ticket import service_ticket_bp
    from application.blueprints.inventory import inventory_bp
    
    app.register_blueprint(customer_bp, url_prefix='/customers')
    app.register_blueprint(mechanic_bp, url_prefix='/mechanics')
    app.register_blueprint(service_ticket_bp, url_prefix='/service-tickets')
    app.register_blueprint(inventory_bp, url_prefix='/inventory')
    app.register_blueprint(swaggerui_blueprint, url_prefix=SWAGGER_URL)  # Registering our swagger blueprint
    
    # Create database tables
    with app.app_context():
        db.create_all()
    
    # Add root route
    @app.route('/')
    def index():
        return {
            'message': 'Welcome to Mechanic Shop API',
            'documentation': '/api/docs',
            'endpoints': {
                'customers': '/customers',
                'mechanics': '/mechanics',
                'service_tickets': '/service-tickets',
                'inventory': '/inventory'
            }
        }
    
    return app