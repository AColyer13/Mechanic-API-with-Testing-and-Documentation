from application import create_app
import os

# Get configuration environment, default to production for Render
config_name = os.environ.get('FLASK_ENV', 'production')

# Create the Flask app
app = create_app(config_name)

if __name__ == '__main__':
    # Get port from environment variable (Render provides this)
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
