from backend.app import create_app
from backend.models import db

app = create_app()
with app.app_context():
    try:
        db.create_all()
        print("Database tables created successfully.")
    except Exception as e:
        print(f"Error creating tables: {e}")
