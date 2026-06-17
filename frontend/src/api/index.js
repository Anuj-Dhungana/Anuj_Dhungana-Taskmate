import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : 'http://localhost:5000'),
    withCredentials: true,
    xsrfCookieName: 'XSRF-TOKEN',
    xsrfHeaderName: 'X-XSRF-TOKEN',
    withXSRFToken: true,
    headers: {
        'Content-Type': 'application/json',
    },
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
    (response) => {
        // Automatically grab CSRF token from custom header if present 
        // (works cross-domain where reading document.cookie is blocked)
        const csrfToken = response.headers['x-csrf-token'];
        if (csrfToken) {
            api.defaults.headers.common['X-XSRF-TOKEN'] = csrfToken;
        }
        return response;
    },
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
