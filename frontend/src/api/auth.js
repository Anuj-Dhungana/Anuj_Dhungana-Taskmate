import api from './index';

// Authentication APIs
export const authAPI = {
    // Register new user
    register: (data) => api.post('/api/auth/register', data),
    
    // Login
    login: (data) => api.post('/api/auth/login', data),
    
    // 2FA login
    login2FA: (data) => api.post('/api/auth/login-2fa', data),
    
    // Logout
    logout: () => api.post('/api/auth/logout'),
    
    // Forgot password
    forgotPassword: (email) => api.post('/api/auth/forgot-password', { email }),
    
    // Reset password
    resetPassword: (token, password) => api.put(`/api/auth/reset-password/${token}`, { password }),
    
    // Update profile
    updateProfile: (data) => api.put('/api/auth/profile', data),
    
    // Toggle 2FA
    toggle2FA: () => api.put('/api/auth/2fa/toggle'),
};
