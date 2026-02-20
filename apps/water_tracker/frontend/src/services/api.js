import axios from 'axios';

const API_URL = import.meta.env.VITE_API_BASE_URL || '/api/';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add a request interceptor to add the auth token
api.interceptors.request.use(
    (config) => {
        const auth = localStorage.getItem('auth');
        if (auth) {
            config.headers['Authorization'] = `Basic ${auth}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default api;
