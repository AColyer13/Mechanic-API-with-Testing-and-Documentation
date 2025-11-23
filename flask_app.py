from application import create_app
import os

# Get configuration environment, default to production for Render
config_name = os.environ.get('FLASK_ENV', 'ProductionConfig')

# Create the Flask app
app = create_app(config_name)

if __name__ == '__main__':
    # Disable debug mode to avoid Python 3.14 debugger import issues on Windows
    app.run(debug=False)
