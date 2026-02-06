import api from './index';

// Workspace APIs
export const workspaceAPI = {
    // Get all workspaces
    getAll: () => api.get('/api/workspaces'),
    
    // Get workspace by ID
    getById: (workspaceId) => api.get(`/api/workspaces/${workspaceId}`),
    
    // Create workspace
    create: (data) => api.post('/api/workspaces', data),
    
    // Update workspace
    update: (workspaceId, data) => api.put(`/api/workspaces/${workspaceId}`, data),
    
    // Delete workspace
    delete: (workspaceId) => api.delete(`/api/workspaces/${workspaceId}`),
    
    // Invite user to workspace
    inviteUser: (workspaceId, email) => api.post(`/api/workspaces/${workspaceId}/invite`, { email }),
    
    // Update member role
    updateMemberRole: (workspaceId, data) => api.put(`/api/workspaces/${workspaceId}/role`, data),
    
    // Remove member from workspace
    removeMember: (workspaceId, userId) => api.delete(`/api/workspaces/${workspaceId}/members/${userId}`),
};
