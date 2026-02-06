import api from './index';

// Board APIs
export const boardAPI = {
    // Get board (lists and cards) by project
    getByProject: (projectId) => api.get(`/api/board/${projectId}`),
    
    // Get workspace stats
    getWorkspaceStats: (workspaceId) => api.get(`/api/board/workspace-stats?workspaceId=${workspaceId}`),
    
    // Get workspace analytics
    getWorkspaceAnalytics: (workspaceId) => api.get(`/api/board/workspace-analytics?workspaceId=${workspaceId}`),
    
    // Get my tasks
    getMyTasks: (workspaceId) => api.get(`/api/board/my-tasks?workspaceId=${workspaceId}`),
    
    // Create list
    createList: (data) => api.post('/api/board/lists', data),
    
    // Update list
    updateList: (listId, data) => api.put(`/api/board/lists/${listId}`, data),
    
    // Delete list
    deleteList: (listId) => api.delete(`/api/board/lists/${listId}`),
    
    // Create card
    createCard: (data) => api.post('/api/board/cards', data),
    
    // Update card
    updateCard: (cardId, data) => api.put(`/api/board/cards/${cardId}`, data),
    
    // Update card with file upload
    updateCardWithFile: (cardId, formData) => api.put(`/api/board/cards/${cardId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),
    
    // Delete card
    deleteCard: (cardId) => api.delete(`/api/board/cards/${cardId}`),
    
    // Reorder cards
    reorderCards: (data) => api.put('/api/board/cards/reorder', data),
};
