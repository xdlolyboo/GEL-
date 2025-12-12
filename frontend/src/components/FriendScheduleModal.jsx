import React, { useState, useEffect } from 'react';
import { Modal, Table, Button } from 'react-bootstrap';
import api from '../api/axios';

const FriendScheduleModal = ({ show, onHide, friendId, friendName }) => {
    const [schedule, setSchedule] = useState([]);
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    useEffect(() => {
        if (show && friendId) {
            fetchSchedule();
        }
    }, [show, friendId]);

    const fetchSchedule = async () => {
        try {
            const res = await api.get(`/schedule/${friendId}`);
            setSchedule(res.data);
        } catch (err) {
            console.error("Error fetching friend schedule", err);
        }
    };

    return (
        <Modal show={show} onHide={onHide} size="lg" centered>
            <Modal.Header closeButton>
                <Modal.Title>{friendName}'s Schedule</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {schedule.length === 0 ? (
                    <p className="text-center text-muted">No classes found.</p>
                ) : (
                    <Table striped bordered hover variant="dark">
                        <thead>
                            <tr>
                                <th>Day</th>
                                <th>Time</th>
                                <th>Course</th>
                            </tr>
                        </thead>
                        <tbody>
                            {schedule.sort((a, b) => a.day_of_week - b.day_of_week || a.start_time.localeCompare(b.start_time)).map(item => (
                                <tr key={item.id}>
                                    <td>{days[item.day_of_week]}</td>
                                    <td>{item.start_time} - {item.end_time}</td>
                                    <td>{item.course_name}</td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                )}
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onHide}>Close</Button>
            </Modal.Footer>
        </Modal>
    );
};

export default FriendScheduleModal;
