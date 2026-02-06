import api from './index';

// Project APIs
export const projectAPI = {
    // Get projects by workspace
    getByWorkspace: (workspaceId) => api.get(`/api/projects?workspaceId=${workspaceId}`),
    
    // Create project
    create: (data) => api.post('/api/projects', data),
    
    // Update project
    update: (projectId, data) => api.put(`/api/projects/${projectId}`, data),
    
    // Delete project
    delete: (projectId) => api.delete(`/api/projects/${projectId}`),
};
