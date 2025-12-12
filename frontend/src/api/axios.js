import axios from 'axios';

// Create an Axios instance with default configuration
const api = axios.create({
    baseURL: 'http://127.0.0.1:5001/api', // Points to the Flask backend
    headers: {
        'Content-Type': 'application/json'
    }
});

// Add a request interceptor to attach the JWT token to every request
// This ensures that protected routes in the backend can identify the user
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default api;
