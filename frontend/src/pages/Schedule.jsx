import React, { useState, useEffect } from 'react';
import { Container, Table, Button, Form, Row, Col, Card } from 'react-bootstrap';
import api from '../api/axios';

const Schedule = () => {
    const [schedule, setSchedule] = useState([]);
    const [newClass, setNewClass] = useState({
        day_of_week: '0',
        start_time: '',
        end_time: '',
        course_name: ''
    });
    const [isUploading, setIsUploading] = useState(false);

    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    useEffect(() => {
        fetchSchedule();
    }, []);

    const fetchSchedule = async () => {
        try {
            const response = await api.get('/schedule');
            setSchedule(response.data);
        } catch (error) {
            console.error('Error fetching schedule:', error);
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        setIsUploading(true);
        try {
            await api.post('/schedule/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            alert('Schedule uploaded and parsed successfully!');
            fetchSchedule();
        } catch (error) {
            console.error('Upload error:', error);
            alert('Failed to upload schedule.');
        } finally {
            setIsUploading(false);
            // Reset input
            e.target.value = null;
        }
    };

    const handleAdd = async (e) => {
        e.preventDefault();
        try {
            await api.post('/schedule', newClass);
            fetchSchedule();
            setNewClass({ ...newClass, course_name: '' }); // Reset course name but keep times for convenience
        } catch (err) {
            alert('Error adding item');
        }
    };

    const handleDelete = async (id) => {
        try {
            await api.delete(`/schedule?id=${id}`);
            fetchSchedule();
        } catch (err) {
            alert('Error deleting item');
        }
    };

    return (
        <Container className="mt-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="text-light mb-0">My Schedule</h2>
                <div>
                    <input
                        type="file"
                        id="scheduleUpload"
                        style={{ display: 'none' }}
                        accept="image/*"
                        onChange={handleFileUpload}
                        disabled={isUploading}
                    />
                    <label htmlFor="scheduleUpload" className={`btn btn-outline-info me-2 ${isUploading ? 'disabled' : ''}`}>
                        {isUploading ? 'Analyzing...' : '📷 Upload Screenshot'}
                    </label>
                    <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                        + Add Class
                    </button>
                </div>
            </div>

            <Card className="mb-4 p-3">
                <h5>Add Class</h5>
                <Form onSubmit={handleAdd}>
                    <Row className="g-2">
                        <Col md={3}>
                            <Form.Select
                                value={newClass.day_of_week} // Changed newItem to newClass
                                onChange={e => setNewClass({ ...newClass, day_of_week: parseInt(e.target.value) })} // Changed newItem to newClass
                            >
                                {days.map((day, idx) => (
                                    <option key={idx} value={idx}>{day}</option>
                                ))}
                            </Form.Select>
                        </Col>
                        <Col md={2}>
                            <Form.Control
                                type="time"
                                required
                                value={newClass.start_time}
                                onChange={e => setNewClass({ ...newClass, start_time: e.target.value })}
                            />
                        </Col>
                        <Col md={2}>
                            <Form.Control
                                type="time"
                                required
                                value={newClass.end_time}
                                onChange={e => setNewClass({ ...newClass, end_time: e.target.value })}
                            />
                        </Col>
                        <Col md={3}>
                            <Form.Control
                                type="text"
                                placeholder="Course Name"
                                value={newClass.course_name}
                                onChange={e => setNewClass({ ...newClass, course_name: e.target.value })}
                            />
                        </Col>
                        <Col md={2}>
                            <Button type="submit" variant="success" className="w-100">Add</Button>
                        </Col>
                    </Row>
                </Form>
            </Card>

            <div className="schedule-grid">
                {days.map((dayName, dayIndex) => {
                    // Filter items for this day and sort by start time
                    const dayItems = schedule
                        .filter(item => item.day_of_week === dayIndex)
                        .sort((a, b) => a.start_time.localeCompare(b.start_time));

                    return (
                        <div key={dayIndex} className="day-column">
                            <div className="day-header">{dayName}</div>
                            {dayItems.length === 0 ? (
                                <div className="text-muted text-center small fst-italic mt-4">No classes</div>
                            ) : (
                                dayItems.map(item => (
                                    <div key={item.id} className="class-card">
                                        <div className="time-badge">
                                            {item.start_time} - {item.end_time}
                                        </div>
                                        <div className="course-name">{item.course_name || 'Untitled Course'}</div>
                                        <Button
                                            variant="danger"
                                            size="sm"
                                            className="delete-btn"
                                            onClick={() => handleDelete(item.id)}
                                        >
                                            ×
                                        </Button>
                                    </div>
                                ))
                            )}
                        </div>
                    );
                })}
            </div>
        </Container>
    );
};

export default Schedule;
