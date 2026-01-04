from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import enum

db = SQLAlchemy()

class LocationEnum(enum.Enum):
    """
    Enumeration of predefined locations where users can be found.
    These values are stored in the database and used for notifications.
    """
    MA_CIGARETTE = "MA cigarette"
    B_CIGARETTE = "B cigarette"
    SEVENTY_EIGHT_CIGARETTE = "78 cigarette"
    FF_CIGARETTE = "FF cigarette"
    SEVENTY_FOUR_CIGARETTE = "74 cigarette"

followers = db.Table('followers',
    db.Column('follower_id', db.Integer, db.ForeignKey('user.id')),
    db.Column('followed_id', db.Integer, db.ForeignKey('user.id'))
)

class User(db.Model):
    """
    User model representing a registered user in the system.
    Stores authentication details and relationships to other entities.
    """
    __table_args__ = {'mysql_engine': 'InnoDB', 'mysql_charset': 'utf8mb4'}
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)  # 255 for werkzeug hashes
    is_active = db.Column(db.Boolean, default=True)
    
    # Relationships
    # cascade="all, delete-orphan" ensures that if a user is deleted, their schedule is also deleted.
    schedule_items = db.relationship('ScheduleItem', backref='user', lazy=True, cascade="all, delete-orphan")
    sent_notifications = db.relationship('Notification', foreign_keys='Notification.sender_id', backref='sender', lazy=True)
    received_notifications = db.relationship('Notification', foreign_keys='Notification.receiver_id', backref='receiver', lazy=True)
    
    # Self-referential many-to-many relationship for followers/following
    followed = db.relationship(
        'User', secondary=followers,
        primaryjoin=(followers.c.follower_id == id),
        secondaryjoin=(followers.c.followed_id == id),
        backref=db.backref('followers', lazy='dynamic'), lazy='dynamic')

    def follow(self, user):
        """Follows a user if not already following."""
        if not self.is_following(user):
            self.followed.append(user)

    def unfollow(self, user):
        """Unfollows a user."""
        if self.is_following(user):
            self.followed.remove(user)

    def is_following(self, user):
        """Checks if this user is following the given user."""
        return self.followed.filter(
            followers.c.followed_id == user.id).count() > 0

    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'is_active': self.is_active
        }

class ScheduleItem(db.Model):
    """
    Represents a single class/course block in a user's weekly schedule.
    Used to determine if a user is 'In Class' or 'Free'.
    """
    __table_args__ = {'mysql_engine': 'InnoDB', 'mysql_charset': 'utf8mb4'}
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    day_of_week = db.Column(db.Integer, nullable=False) # 0=Monday, 6=Sunday
    start_time = db.Column(db.String(5), nullable=False) # Format HH:MM (24-hour)
    end_time = db.Column(db.String(5), nullable=False)   # Format HH:MM (24-hour)
    course_name = db.Column(db.String(100), nullable=True)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'day_of_week': self.day_of_week,
            'start_time': self.start_time,
            'end_time': self.end_time,
            'course_name': self.course_name
        }

class Notification(db.Model):
    """
    Represents an invite/notification sent from one user to another.
    Includes the location where the sender is inviting the receiver.
    """
    __table_args__ = {'mysql_engine': 'InnoDB', 'mysql_charset': 'utf8mb4'}
    
    id = db.Column(db.Integer, primary_key=True)
    sender_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    receiver_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    location = db.Column(db.Enum(LocationEnum), nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    is_read = db.Column(db.Boolean, default=False)

    def to_dict(self):
        return {
            'id': self.id,
            'sender_id': self.sender_id,
            'sender_username': self.sender.username,
            'receiver_id': self.receiver_id,
            'location': self.location.value,
            'timestamp': self.timestamp.isoformat(),
            'is_read': self.is_read
        }

class FriendRequest(db.Model):
    """
    Represents a pending friend request between two users.
    Once accepted, a mutual follow relationship is created in the User model.
    """
    __table_args__ = {'mysql_engine': 'InnoDB', 'mysql_charset': 'utf8mb4'}
    
    id = db.Column(db.Integer, primary_key=True)
    sender_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    receiver_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    status = db.Column(db.String(20), default='pending') # pending, accepted, rejected
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

    sender = db.relationship('User', foreign_keys=[sender_id], backref='sent_requests')
    receiver = db.relationship('User', foreign_keys=[receiver_id], backref='received_requests')

    def to_dict(self):
        return {
            'id': self.id,
            'sender_id': self.sender_id,
            'sender_username': self.sender.username,
            'receiver_id': self.receiver_id,
            'receiver_username': self.receiver.username,
            'status': self.status,
            'timestamp': self.timestamp.isoformat()
        }

class VerificationCode(db.Model):
    """
    Stores email verification codes temporarily.
    """
    __table_args__ = {'mysql_engine': 'InnoDB', 'mysql_charset': 'utf8mb4'}
    
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    code = db.Column(db.String(6), nullable=False)
    expires_at = db.Column(db.DateTime, nullable=False)

    def is_valid(self):
        return datetime.utcnow() < self.expires_at
