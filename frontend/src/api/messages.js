import api from './index';

// Message APIs
export const messageAPI = {
    // Get messages by channel
    getByChannel: (channelId) => api.get(`/api/messages/${channelId}`),
    
    // Send message
    send: (data) => api.post('/api/messages', data),
    
    // Delete message
    delete: (messageId) => api.delete(`/api/messages/${messageId}`),
};
