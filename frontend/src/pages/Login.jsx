import React, { useState, useContext } from 'react';
import { Form, Button, Container, Alert, Card } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { AuthContext } from '../context/AuthContext';

const Login = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
    const [codeSent, setCodeSent] = useState(false);
    const [error, setError] = useState('');
    const [emailError, setEmailError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleEmailBlur = async () => {
        if (isLogin || !email || codeSent) return; // Don't check if code already sent

        try {
            const response = await api.post('/check-email', { email });
            if (!response.data.available) {
                setEmailError('Email is already registered.');
            } else {
                setEmailError('');
            }
        } catch (err) {
            console.error('Email check error:', err);
        }
    };

    const handleSendCode = async () => {
        if (!email) {
            setEmailError('Please enter an email first.');
            return;
        }
        if (emailError) return;

        setIsLoading(true);
        setError('');
        setSuccessMsg('');

        try {
            await api.post('/send-verification-code', { email });
            setCodeSent(true);
            setSuccessMsg('Verification code sent to your email!');
        } catch (err) {
            console.error('Send Code Error:', err);
            setError(err.response?.data?.msg || 'Failed to send code.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMsg('');
        setIsLoading(true);

        try {
            if (isLogin) {
                console.log('Attempting Login:', { username });
                const response = await api.post('/login', { username, password });
                console.log('Login Success:', response.data);
                login(response.data.access_token);
                navigate('/dashboard');
            } else {
                console.log('Attempting Registration:', { username, email, code: verificationCode });
                const response = await api.post('/register', {
                    username,
                    email,
                    password,
                    verification_code: verificationCode
                });
                console.log('Registration Success:', response.data);
                alert('Registration successful! Please log in.');
                setIsLogin(true);
                setPassword('');
                setEmail('');
                setVerificationCode('');
                setCodeSent(false);
            }
        } catch (err) {
            console.error('Auth Error:', err);
            const msg = err.response?.data?.msg || err.message || 'An error occurred';
            setError(msg);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <div className="live-background"></div>
            <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh', position: 'relative', zIndex: 1 }}>
                <Card style={{ width: '400px' }}>
                    <Card.Body>
                        <h1 className="auth-title">GEL!</h1>
                        <p className="auth-subtitle">
                            {isLogin ? 'Login to your account' : 'Create your account'}
                        </p>
                        {error && <Alert variant="danger">{error}</Alert>}
                        {successMsg && <Alert variant="success">{successMsg}</Alert>}

                        <Form onSubmit={handleSubmit}>
                            <Form.Group id="username" className="mb-3">
                                <Form.Label>Username</Form.Label>
                                <Form.Control
                                    type="text"
                                    required
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                />
                            </Form.Group>

                            {!isLogin && (
                                <>
                                    <Form.Group id="email" className="mb-3">
                                        <Form.Label>Email</Form.Label>
                                        <div className="d-flex gap-2">
                                            <Form.Control
                                                type="email"
                                                required
                                                value={email}
                                                onChange={(e) => {
                                                    setEmail(e.target.value);
                                                    setEmailError('');
                                                }}
                                                onBlur={handleEmailBlur}
                                                isInvalid={!!emailError}
                                                disabled={codeSent}
                                            />
                                            {!codeSent && (
                                                <Button
                                                    variant="secondary"
                                                    onClick={handleSendCode}
                                                    disabled={isLoading || !!emailError || !email}
                                                >
                                                    Send Code
                                                </Button>
                                            )}
                                        </div>
                                        <Form.Control.Feedback type="invalid" style={{ display: emailError ? 'block' : 'none' }}>
                                            {emailError}
                                        </Form.Control.Feedback>
                                    </Form.Group>

                                    {codeSent && (
                                        <Form.Group id="verificationCode" className="mb-3">
                                            <Form.Label>Verification Code</Form.Label>
                                            <Form.Control
                                                type="text"
                                                required
                                                placeholder="Enter 6-digit code"
                                                value={verificationCode}
                                                onChange={(e) => setVerificationCode(e.target.value)}
                                            />
                                            <Form.Text className="text-muted">
                                                Check your email for the code.
                                            </Form.Text>
                                        </Form.Group>
                                    )}
                                </>
                            )}

                            <Form.Group id="password" className="mb-3">
                                <Form.Label>Password</Form.Label>
                                <Form.Control
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </Form.Group>

                            <Button className="w-100" type="submit" disabled={isLoading}>
                                {isLoading ? 'Processing...' : (isLogin ? 'Log In' : 'Register')}
                            </Button>
                        </Form>
                        <div className="mt-3 text-center">
                            {isLogin ? (
                                <p>
                                    Don't have an account?{' '}
                                    <Button variant="link" onClick={() => {
                                        setIsLogin(false);
                                        setError('');
                                        setSuccessMsg('');
                                    }}>
                                        Register
                                    </Button>
                                </p>
                            ) : (
                                <p>
                                    Already have an account?{' '}
                                    <Button variant="link" onClick={() => {
                                        setIsLogin(true);
                                        setError('');
                                        setSuccessMsg('');
                                    }}>
                                        Log In
                                    </Button>
                                </p>
                            )}
                        </div>
                    </Card.Body>
                </Card>
            </Container>
        </>
    );
};

export default Login;
