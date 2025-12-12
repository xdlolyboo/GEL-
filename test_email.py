import os
from flask import Flask
from flask_mail import Mail, Message
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)

# Config
app.config['MAIL_SERVER'] = os.environ.get('MAIL_SERVER')
app.config['MAIL_PORT'] = int(os.environ.get('MAIL_PORT') or 587)
app.config['MAIL_USE_TLS'] = os.environ.get('MAIL_USE_TLS') == 'True'
app.config['MAIL_USERNAME'] = os.environ.get('MAIL_USERNAME')
app.config['MAIL_PASSWORD'] = os.environ.get('MAIL_PASSWORD')
app.config['MAIL_DEFAULT_SENDER'] = os.environ.get('MAIL_DEFAULT_SENDER') or os.environ.get('MAIL_USERNAME')
app.config['DEBUG'] = True # Enable debug mode for more info

print("--- Mail Configuration ---")
print(f"Server: {app.config['MAIL_SERVER']}")
print(f"Port: {app.config['MAIL_PORT']}")
print(f"TLS: {app.config['MAIL_USE_TLS']}")
print(f"Username: {app.config['MAIL_USERNAME']}")
print(f"Password: {'*' * 5 if app.config['MAIL_PASSWORD'] else 'None'}")
print(f"Sender: {app.config['MAIL_DEFAULT_SENDER']}")
print("--------------------------")

mail = Mail(app)

with app.app_context():
    try:
        print("Attempting to send test email...")
        msg = Message("Test Email", recipients=[app.config['MAIL_USERNAME']])
        msg.body = "This is a test email from the debugging script."
        mail.send(msg)
        print("Email sent successfully!")
    except Exception as e:
        print(f"Failed to send email: {e}")
        import traceback
        traceback.print_exc()
