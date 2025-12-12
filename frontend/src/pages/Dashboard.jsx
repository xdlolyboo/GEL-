import React, { useState, useEffect, useContext } from 'react';
import { Container, Row, Col, Card, Button, Badge, Modal, Form, InputGroup } from 'react-bootstrap';
import api from '../api/axios';
import { AuthContext } from '../context/AuthContext';
import FriendScheduleModal from '../components/FriendScheduleModal';

const Dashboard = () => {
    const [friends, setFriends] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [selectedFriend, setSelectedFriend] = useState(null);
    const [selectedLocation, setSelectedLocation] = useState('MA cigarette');

    // Add Friend State
    const [newFriendUsername, setNewFriendUsername] = useState('');

    // Friend Requests State
    const [friendRequests, setFriendRequests] = useState([]);

    // View Schedule State
    const [showScheduleModal, setShowScheduleModal] = useState(false);
    const [scheduleFriend, setScheduleFriend] = useState(null);

    const { user } = useContext(AuthContext);

    const locations = [
        "MA cigarette",
        "B cigarette",
        "78 cigarette",
        "FF cigarette",
        "74 cigarette"
    ];

    useEffect(() => {
        fetchFriendsStatus();
        fetchNotifications();
        fetchFriendRequests();

        // Poll every 30 seconds
        const interval = setInterval(() => {
            fetchFriendsStatus();
            fetchNotifications();
            fetchFriendRequests();
        }, 30000);

        return () => clearInterval(interval);
    }, []);

    const fetchFriendsStatus = async () => {
        try {
            const res = await api.get('/friends/status');
            setFriends(res.data);
        } catch (err) {
            console.error("Error fetching friends", err);
        }
    };

    const fetchNotifications = async () => {
        try {
            const res = await api.get('/notifications');
            setNotifications(res.data);
        } catch (err) {
            console.error("Error fetching notifications", err);
        }
    };

    const fetchFriendRequests = async () => {
        try {
            const res = await api.get('/friends/requests');
            setFriendRequests(res.data);
        } catch (err) {
            console.error("Error fetching requests", err);
        }
    };

    const handleSendRequest = async (e) => {
        e.preventDefault();
        try {
            await api.post('/friends/request', { username: newFriendUsername });
            alert(`Friend request sent to ${newFriendUsername}!`);
            setNewFriendUsername('');
        } catch (err) {
            alert('Failed to send request: ' + (err.response?.data?.msg || err.message));
        }
    };

    const handleAcceptRequest = async (reqId) => {
        try {
            await api.post('/friends/accept', { request_id: reqId });
            fetchFriendRequests();
            fetchFriendsStatus();
        } catch (err) {
            alert('Error accepting request');
        }
    };

    const handleRejectRequest = async (reqId) => {
        try {
            await api.post('/friends/reject', { request_id: reqId });
            fetchFriendRequests();
        } catch (err) {
            alert('Error rejecting request');
        }
    };

    const handleInviteClick = (friend) => {
        setSelectedFriend(friend);
        setShowInviteModal(true);
    };

    const handleViewSchedule = (friend) => {
        setScheduleFriend(friend);
        setShowScheduleModal(true);
    };

    const sendInvite = async () => {
        try {
            await api.post('/invite', {
                receiver_id: selectedFriend.id,
                location: selectedLocation
            });
            alert('Invite sent!');
            setShowInviteModal(false);
        } catch (err) {
            alert('Failed to send invite: ' + (err.response?.data?.msg || err.message));
        }
    };

    const markRead = async (id) => {
        try {
            await api.post('/notifications/read', { id });
            setNotifications(notifications.filter(n => n.id !== id));
        } catch (err) {
            console.error("Error marking read", err);
        }
    };

    return (
        <Container className="mt-4">
            {/* Add Friend Section */}
            <Card className="mb-5 p-4 shadow-lg border-0" style={{ background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.9), rgba(15, 23, 42, 0.9))' }}>
                <Row className="align-items-center">
                    <Col md={8}>
                        <h4 className="mb-1 text-white">Grow Your Circle</h4>
                        <p className="text-muted mb-0">Send a friend request by username.</p>
                    </Col>
                    <Col md={4}>
                        <Form onSubmit={handleSendRequest}>
                            <InputGroup>
                                <Form.Control
                                    placeholder="Username..."
                                    value={newFriendUsername}
                                    onChange={(e) => setNewFriendUsername(e.target.value)}
                                />
                                <Button variant="primary" type="submit">
                                    Send Request
                                </Button>
                            </InputGroup>
                        </Form>
                    </Col>
                </Row>
            </Card>

            {/* Pending Requests Section */}
            {friendRequests.length > 0 && (
                <div className="mb-5">
                    <h3 className="mb-3 fw-bold">Pending Requests</h3>
                    <Row xs={1} md={2} lg={3} className="g-4">
                        {friendRequests.map(req => (
                            <Col key={req.id}>
                                <Card className="h-100 shadow-sm border-0 border-start border-4 border-warning">
                                    <Card.Body>
                                        <Card.Title className="h5 fw-bold mb-3">{req.sender_username}</Card.Title>
                                        <div className="d-flex gap-2">
                                            <Button variant="success" size="sm" className="flex-grow-1" onClick={() => handleAcceptRequest(req.id)}>Accept</Button>
                                            <Button variant="outline-danger" size="sm" className="flex-grow-1" onClick={() => handleRejectRequest(req.id)}>Reject</Button>
                                        </div>
                                    </Card.Body>
                                </Card>
                            </Col>
                        ))}
                    </Row>
                </div>
            )}

            <h2 className="mb-4 fw-bold">Friends Status</h2>
            {friends.length === 0 ? (
                <div className="text-center py-5 text-muted">
                    <h5>No friends added yet.</h5>
                    <p>Use the box above to add your first friend!</p>
                </div>
            ) : (
                <Row xs={1} md={2} lg={3} className="g-4">
                    {friends.map(friend => (
                        <Col key={friend.id}>
                            <Card className="h-100 shadow-sm border-0">
                                <Card.Body>
                                    <div className="d-flex justify-content-between align-items-start mb-3">
                                        <div>
                                            <Card.Title className="h5 fw-bold mb-1">{friend.username}</Card.Title>
                                            <Badge bg={friend.is_free ? "success" : "danger"} className="px-3 py-2 rounded-pill">
                                                {friend.status}
                                            </Badge>
                                        </div>
                                        {friend.is_free && (
                                            <Button
                                                variant="outline-primary"
                                                size="sm"
                                                className="rounded-pill px-3"
                                                onClick={() => handleInviteClick(friend)}
                                            >
                                                Smoke?
                                            </Button>
                                        )}
                                    </div>
                                    <div className="d-grid">
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            className="bg-transparent text-secondary border-secondary"
                                            onClick={() => handleViewSchedule(friend)}
                                        >
                                            View Schedule
                                        </Button>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                    ))}
                </Row>
            )}

            <h3 className="mt-5 mb-3 fw-bold">Notifications</h3>
            {notifications.length === 0 ? (
                <p className="text-muted">No new invites.</p>
            ) : (
                notifications.map(notif => (
                    <Card key={notif.id} className="mb-3 border-start border-4 border-info">
                        <Card.Body className="d-flex justify-content-between align-items-center">
                            <div>
                                <strong>{notif.sender_username}</strong> invited you to <strong className="text-info">{notif.location}</strong>
                                <div className="text-muted small">{new Date(notif.timestamp).toLocaleTimeString()}</div>
                            </div>
                            <Button variant="outline-secondary" size="sm" onClick={() => markRead(notif.id)}>Dismiss</Button>
                        </Card.Body>
                    </Card>
                ))
            )}

            {/* Invite Modal */}
            <Modal show={showInviteModal} onHide={() => setShowInviteModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Send Invite to {selectedFriend?.username}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form.Group>
                        <Form.Label>Select Location</Form.Label>
                        <Form.Select value={selectedLocation} onChange={(e) => setSelectedLocation(e.target.value)}>
                            {locations.map(loc => (
                                <option key={loc} value={loc}>{loc}</option>
                            ))}
                        </Form.Select>
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowInviteModal(false)}>Cancel</Button>
                    <Button variant="primary" onClick={sendInvite}>Send Invite</Button>
                </Modal.Footer>
            </Modal>

            {/* View Schedule Modal */}
            <FriendScheduleModal
                show={showScheduleModal}
                onHide={() => setShowScheduleModal(false)}
                friendId={scheduleFriend?.id}
                friendName={scheduleFriend?.username}
            />
        </Container>
    );
};

export default Dashboard;
