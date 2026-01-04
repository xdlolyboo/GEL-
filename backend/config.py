import os
from datetime import timedelta

class Config:
    """
    Configuration class for the Flask application.
    Reads from environment variables or uses default values for development.
    """
    # Secret key for session management and security (should be complex in prod)
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-key-change-in-prod'
    
    # Database connection URI (SQLite for dev, PostgreSQL/MySQL for prod)
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or 'sqlite:///smoke_break.db'
    
    # Disable modification tracking to save memory
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # MySQL-specific connection pool options (ignored for SQLite)
    SQLALCHEMY_ENGINE_OPTIONS = {
        'pool_pre_ping': True,      # Verify connections before use
        'pool_recycle': 3600,       # Recycle connections after 1 hour
    }
    
    # Secret key for signing JWT tokens
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY') or 'jwt-secret-key-change-in-prod'
    
    # Token expiration time (7 days for mobile app convenience)
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(days=7)

    # Mail Configuration
    MAIL_SERVER = os.environ.get('MAIL_SERVER') or 'smtp.gmail.com'
    MAIL_PORT = int(os.environ.get('MAIL_PORT') or 587)
    MAIL_USE_TLS = os.environ.get('MAIL_USE_TLS') is not None
    MAIL_USERNAME = os.environ.get('MAIL_USERNAME')
    MAIL_PASSWORD = os.environ.get('MAIL_PASSWORD')
    MAIL_DEFAULT_SENDER = os.environ.get('MAIL_DEFAULT_SENDER') or MAIL_USERNAME
