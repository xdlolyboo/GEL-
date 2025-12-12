from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
import os
from werkzeug.utils import secure_filename
from werkzeug.utils import secure_filename
from .models import db, User, ScheduleItem, Notification, LocationEnum, FriendRequest, VerificationCode
from .ai_service import ScheduleParser
from .extensions import mail
from flask_mail import Message
import random
from datetime import timedelta

# Initialize AI Parser
# WARNING: In production, use environment variable!
API_KEY = "AIzaSyAx1jebcbvowPnxZwkbE2efNe41ZGI8LJw"
parser = ScheduleParser(API_KEY)

UPLOAD_FOLDER = 'uploads'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

api = Blueprint('api', __name__)

# --- Auth Routes ---

@api.route('/send-verification-code', methods=['POST'])
def send_verification_code():
    """
    Generates a 6-digit code, saves it, and sends it to the provided email.
    """
    data = request.get_json()
    email = data.get('email')

    if not email:
        return jsonify({"msg": "Email is required"}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({"msg": "Email already registered"}), 400

    # Generate 6-digit code
    code = str(random.randint(100000, 999999))
    expires_at = datetime.utcnow() + timedelta(minutes=10)

    # Save or update code in DB
    existing_code = VerificationCode.query.filter_by(email=email).first()
    if existing_code:
        existing_code.code = code
        existing_code.expires_at = expires_at
    else:
        new_code = VerificationCode(email=email, code=code, expires_at=expires_at)
        db.session.add(new_code)
    
    db.session.commit()

    # Send email
    try:
        msg = Message("GEL! Verification Code", recipients=[email])
        msg.body = f"Your verification code is: {code}\nIt expires in 10 minutes."
        mail.send(msg)
        return jsonify({"msg": "Verification code sent"}), 200
    except Exception as e:
        print(f"Mail Error: {e}")
        return jsonify({"msg": "Failed to send email"}), 500

@api.route('/register', methods=['POST'])
def register():
    """
    Registers a new user.
    Expects JSON: { "username": "...", "email": "...", "password": "...", "verification_code": "..." }
    Returns 201 on success, 400 if user exists or code invalid.
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({"msg": "No data provided"}), 400
            
        username = data.get('username')
        email = data.get('email')
        password = data.get('password')
        code = data.get('verification_code')

        if not username or not email or not password or not code:
            return jsonify({"msg": "Missing fields"}), 400

        # Verify Code
        v_code = VerificationCode.query.filter_by(email=email).first()
        if not v_code or v_code.code != code:
            return jsonify({"msg": "Invalid verification code"}), 400
        
        if not v_code.is_valid():
            return jsonify({"msg": "Verification code expired"}), 400

        if User.query.filter_by(username=username).first():
            return jsonify({"msg": "Username already exists"}), 400
            
        if User.query.filter_by(email=email).first():
            return jsonify({"msg": "Email already exists"}), 400

        hashed_password = generate_password_hash(password)
        new_user = User(username=username, email=email, password_hash=hashed_password)
        
        db.session.add(new_user)
        # Delete used code
        db.session.delete(v_code)
        db.session.commit()

        return jsonify({"msg": "User registered successfully"}), 201
    except Exception as e:
        print(f"Registration Error: {e}")
        return jsonify({"msg": "Internal Server Error"}), 500



@api.route('/check-email', methods=['POST'])
def check_email():
    """
    Checks if an email is already registered.
    Used for real-time validation on the frontend registration form.
    """
    try:
        data = request.get_json()
        email = data.get('email')
        
        if not email:
            return jsonify({"msg": "Email is required"}), 400
            
        user = User.query.filter_by(email=email).first()
        if user:
            return jsonify({"available": False, "msg": "Email already exists"}), 200 # Using 200 so frontend can handle it easily
        else:
            return jsonify({"available": True, "msg": "Email is available"}), 200
            
    except Exception as e:
        print(f"Check Email Error: {e}")
        return jsonify({"msg": "Internal Server Error"}), 500

@api.route('/login', methods=['POST'])
def login():
    """
    Authenticates a user and returns a JWT access token.
    Expects JSON: { "username": "...", "password": "..." }
    Returns 200 with token, user_id, and username.
    """
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    user = User.query.filter_by(username=username).first()
    if user and check_password_hash(user.password_hash, password):
        # Cast identity to string to ensure compatibility
        access_token = create_access_token(identity=str(user.id))
        return jsonify(access_token=access_token, user_id=user.id, username=user.username), 200

    return jsonify({"msg": "Invalid credentials"}), 401

# --- Schedule Routes ---

@api.route('/schedule', methods=['GET', 'POST', 'DELETE'])
@jwt_required()
def handle_schedule():
    """
    Manages the current user's schedule items.
    GET: Returns all schedule items for the user.
    POST: Adds a new schedule item manually.
    DELETE: Removes a schedule item by ID.
    """
    current_user_id = int(get_jwt_identity())

    if request.method == 'GET':
        items = ScheduleItem.query.filter_by(user_id=current_user_id).all()
        return jsonify([item.to_dict() for item in items]), 200

    if request.method == 'POST':
        data = request.get_json()
        # Validate data...
        new_item = ScheduleItem(
            user_id=current_user_id,
            day_of_week=data['day_of_week'],
            start_time=data['start_time'],
            end_time=data['end_time'],
            course_name=data.get('course_name')
        )
        db.session.add(new_item)
        db.session.commit()
        return jsonify(new_item.to_dict()), 201

    if request.method == 'DELETE':
        item_id = request.args.get('id')
        item = ScheduleItem.query.filter_by(id=item_id, user_id=current_user_id).first()
        if item:
            db.session.delete(item)
            db.session.commit()
            return jsonify({"msg": "Deleted"}), 200
        return jsonify({"msg": "Item not found"}), 404

        return jsonify({"msg": "Item not found"}), 404

@api.route('/schedule/upload', methods=['POST'])
@jwt_required()
def upload_schedule():
    """
    Uploads an image of a schedule, parses it using Gemini AI, and saves items to DB.
    Expects a file part named 'file'.
    Returns 201 with the list of added items.
    """
    current_user_id = int(get_jwt_identity())
    
    if 'file' not in request.files:
        return jsonify({"msg": "No file part"}), 400
        
    file = request.files['file']
    if file.filename == '':
        return jsonify({"msg": "No selected file"}), 400
        
    if file:
        filename = secure_filename(file.filename)
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        file.save(filepath)
        
        try:
            # Parse with AI
            items_data = parser.parse_schedule_image(filepath)
            
            added_items = []
            for item in items_data:
                new_item = ScheduleItem(
                    user_id=current_user_id,
                    day_of_week=item['day'],
                    start_time=item['start_time'],
                    end_time=item['end_time'],
                    course_name=item['course_name']
                )
                db.session.add(new_item)
                added_items.append(new_item.to_dict())
            
            db.session.commit()
            
            # Clean up file
            os.remove(filepath)
            
            return jsonify({"msg": "Schedule parsed and added", "items": added_items}), 201
            
        except Exception as e:
            print(f"Upload Error: {e}")
            return jsonify({"msg": "Failed to process schedule"}), 500

@api.route('/schedule/<int:user_id>', methods=['GET'])
@jwt_required()
def get_user_schedule(user_id):
    """
    Retrieves the schedule of a specific user.
    Useful for viewing a friend's schedule.
    """
    # In a real app, check if they are friends first
    items = ScheduleItem.query.filter_by(user_id=user_id).all()
    return jsonify([item.to_dict() for item in items]), 200

def is_user_free(user_id):
    """
    Helper function to check if a user is currently free based on their schedule.
    Returns True if free, False if currently in a class.
    """
    # Get current time
    now = datetime.now()
    current_day = now.weekday() # 0=Monday, 6=Sunday
    current_time_str = now.strftime("%H:%M")

    # Query schedule for today
    todays_schedule = ScheduleItem.query.filter_by(
        user_id=user_id, 
        day_of_week=current_day
    ).all()

    for item in todays_schedule:
        # Simple string comparison works for HH:MM format (24h)
        if item.start_time <= current_time_str <= item.end_time:
            return False # In Class
    
    return True # Free

@api.route('/friends/status', methods=['GET'])
@jwt_required()
def get_friends_status():
    """
    Returns the status (Free/In Class) of all friends (users followed by current user).
    """
    current_user_id = int(get_jwt_identity())
    # For MVP, all users are "friends". In real app, would query friend relationships.
    current_user_id = int(get_jwt_identity())
    current_user = User.query.get(current_user_id)
    
    # Get users that the current user follows (friends)
    # Also include followers? For now, let's just say "friends" are people I follow.
    # Or maybe mutual? Let's stick to "people I follow" for simplicity of "adding friends".
    friends = current_user.followed.all()
    
    result = []
    for user in friends:
        is_free = is_user_free(user.id)
        result.append({
            'id': user.id,
            'username': user.username,
            'status': 'Free' if is_free else 'In Class',
            'is_free': is_free
        })
    
    return jsonify(result), 200

    return jsonify(result), 200

@api.route('/friends/request', methods=['POST'])
@jwt_required()
def send_friend_request():
    """
    Sends a friend request to another user by username.
    """
    current_user_id = int(get_jwt_identity())
    data = request.get_json()
    username = data.get('username')
    
    user_to_add = User.query.filter_by(username=username).first()
    if not user_to_add:
        return jsonify({"msg": "User not found"}), 404
        
    if user_to_add.id == current_user_id:
        return jsonify({"msg": "You cannot add yourself"}), 400

    # Check if already friends
    current_user = User.query.get(current_user_id)
    if current_user.is_following(user_to_add):
        return jsonify({"msg": "Already friends"}), 400

    # Check if request already exists
    existing_req = FriendRequest.query.filter_by(
        sender_id=current_user_id, 
        receiver_id=user_to_add.id, 
        status='pending'
    ).first()
    
    if existing_req:
        return jsonify({"msg": "Request already sent"}), 400

    new_req = FriendRequest(sender_id=current_user_id, receiver_id=user_to_add.id)
    db.session.add(new_req)
    db.session.commit()
    
    return jsonify({"msg": f"Friend request sent to {username}"}), 200

@api.route('/friends/requests', methods=['GET'])
@jwt_required()
def get_friend_requests():
    """
    Retrieves all pending friend requests received by the current user.
    """
    current_user_id = int(get_jwt_identity())
    # Get pending requests received by current user
    reqs = FriendRequest.query.filter_by(receiver_id=current_user_id, status='pending').all()
    return jsonify([r.to_dict() for r in reqs]), 200

@api.route('/friends/accept', methods=['POST'])
@jwt_required()
def accept_friend_request():
    """
    Accepts a friend request.
    Creates a mutual follow relationship between the two users.
    """
    current_user_id = int(get_jwt_identity())
    data = request.get_json()
    req_id = data.get('request_id')
    
    freq = FriendRequest.query.get(req_id)
    if not freq or freq.receiver_id != current_user_id:
        return jsonify({"msg": "Request not found"}), 404
        
    freq.status = 'accepted'
    
    # Create mutual friendship
    sender = User.query.get(freq.sender_id)
    receiver = User.query.get(freq.receiver_id)
    
    sender.follow(receiver)
    receiver.follow(sender)
    
    db.session.commit()
    return jsonify({"msg": "Friend request accepted"}), 200

@api.route('/friends/reject', methods=['POST'])
@jwt_required()
def reject_friend_request():
    """
    Rejects a friend request.
    """
    current_user_id = int(get_jwt_identity())
    data = request.get_json()
    req_id = data.get('request_id')
    
    freq = FriendRequest.query.get(req_id)
    if not freq or freq.receiver_id != current_user_id:
        return jsonify({"msg": "Request not found"}), 404
        
    freq.status = 'rejected'
    db.session.commit()
    return jsonify({"msg": "Friend request rejected"}), 200

@api.route('/invite', methods=['POST'])
@jwt_required()
def send_invite():
    """
    Sends a "Smoke Break" invitation to a friend at a specific location.
    Checks if the receiver is free before sending (optional UX enhancement).
    """
    current_user_id = int(get_jwt_identity())
    data = request.get_json()
    receiver_id = data.get('receiver_id')
    location_str = data.get('location')

    try:
        location_enum = LocationEnum(location_str)
    except ValueError:
        return jsonify({"msg": "Invalid location"}), 400

    # Check if receiver is free? (Optional, but good UX)
    if not is_user_free(receiver_id):
        return jsonify({"msg": "User is currently in class!"}), 400

    new_notif = Notification(
        sender_id=current_user_id,
        receiver_id=receiver_id,
        location=location_enum
    )
    db.session.add(new_notif)
    db.session.commit()
    return jsonify({"msg": "Invite sent"}), 201

@api.route('/notifications', methods=['GET'])
@jwt_required()
def get_notifications():
    """
    Retrieves all unread notifications/invites for the current user.
    """
    current_user_id = int(get_jwt_identity())
    # Get unread notifications
    notifs = Notification.query.filter_by(receiver_id=current_user_id, is_read=False).all()
    return jsonify([n.to_dict() for n in notifs]), 200

@api.route('/notifications/read', methods=['POST'])
@jwt_required()
def mark_read():
    """
    Marks a specific notification as read.
    """
    current_user_id = int(get_jwt_identity())
    data = request.get_json()
    notif_id = data.get('id')
    
    notif = Notification.query.filter_by(id=notif_id, receiver_id=current_user_id).first()
    if notif:
        notif.is_read = True
        db.session.commit()
        return jsonify({"msg": "Marked as read"}), 200
    return jsonify({"msg": "Notification not found"}), 404
@api.route('/debug/info', methods=['GET'])
def debug_info():
    """
    Debug endpoint to check server status and database connectivity.
    """
    try:
        user_count = User.query.count()
        users = User.query.all()
        user_list = [{"id": u.id, "username": u.username} for u in users]
        
        db_uri = current_app.config.get('SQLALCHEMY_DATABASE_URI')
        
        return jsonify({
            "status": "online",
            "database_uri": str(db_uri),
            "user_count": user_count,
            "users": user_list,
            "cwd": os.getcwd()
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
