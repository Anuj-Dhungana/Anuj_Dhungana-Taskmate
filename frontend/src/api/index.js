import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
    // Automatically read XSRF-TOKEN cookie and attach as X-XSRF-TOKEN header for state-changing requests
    xsrfCookieName: 'XSRF-TOKEN',
    xsrfHeaderName: 'X-XSRF-TOKEN',
    // Required in Axios 1.6+ to send XSRF header in cross-origin requests
    withXSRFToken: true,
});

// Request interceptor
api.interceptors.request.use(
    (config) => {
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Prevent infinite redirect loop by clearing auth config
            localStorage.removeItem('userInfo');
            // Redirect to login or handle unauthorized
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;
