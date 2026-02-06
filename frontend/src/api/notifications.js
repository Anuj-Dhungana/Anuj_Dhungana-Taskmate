import api from './index';

// Notification APIs
export const notificationAPI = {
    // Get all notifications
    getAll: () => api.get('/api/notifications'),
    
    // Mark notification as read
    markAsRead: (notificationId) => api.put(`/api/notifications/${notificationId}/read`),
    
    // Mark all as read
    markAllAsRead: () => api.put('/api/notifications/read-all'),
    
    // Delete notification
    delete: (notificationId) => api.delete(`/api/notifications/${notificationId}`),
};
