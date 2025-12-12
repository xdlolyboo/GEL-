import axios from 'axios';
import { Platform } from 'react-native';

let baseURL = 'http://localhost:5001/api';

// Use LAN IP for physical device testing
// This is critical because 'localhost' on a physical phone refers to the phone itself, not your computer.
// You must update this IP if your computer's IP changes (e.g., different Wi-Fi).
const LAN_IP = '10.201.199.218';

if (Platform.OS === 'android' || Platform.OS === 'ios') {
    // For physical device testing (update this with your tunnel URL)
    baseURL = 'https://c2960b2e95c3ea.lhr.life/api';
} else {
    // For Web (browser), localhost works perfectly.
    baseURL = 'http://localhost:5001/api';
}

// For physical devices, you might need to replace localhost with your machine's LAN IP
// e.g., baseURL = 'http://192.168.1.X:5001/api';

const api = axios.create({
    baseURL,
    headers: {
        'Content-Type': 'application/json'
    }
});

export default api;
