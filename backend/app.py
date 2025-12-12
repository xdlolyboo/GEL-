from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from .config import Config
from .models import db
from .routes import api
from dotenv import load_dotenv

load_dotenv()

def create_app():
    """
    Factory function to create and configure the Flask application.
    This pattern allows for better testing and multiple instances if needed.
    """
    app = Flask(__name__)
    
    # Load configuration from config.py
    app.config.from_object(Config)

    # Initialize Flask extensions
    db.init_app(app)       # Initialize SQLAlchemy for database operations
    JWTManager(app)        # Initialize JWT for authentication handling
    CORS(app)              # Enable Cross-Origin Resource Sharing for frontend/mobile access
    
    from .extensions import mail
    mail.init_app(app)

    # Register Blueprint
    # Blueprints organize routes into modular components.
    # All API routes will be prefixed with /api (e.g., /api/login)
    app.register_blueprint(api, url_prefix='/api')

    # Create DB tables
    # In a production app, you would use Flask-Migrate (Alembic) instead of create_all()
    with app.app_context():
        db.create_all()

    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, host='0.0.0.0', port=5001)
