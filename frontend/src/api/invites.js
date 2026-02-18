import api from './index';

// Invite APIs
export const inviteAPI = {
    // Send invite to join workspace
    sendInvite: (data) => api.post('/api/invites/send', data),

    // Get my pending invites
    getMyInvites: () => api.get('/api/invites/my-invites'),

    // Get all invites for a workspace (admin/owner only)
    getWorkspaceInvites: (workspaceId) => api.get(`/api/invites/workspace/${workspaceId}`),

    // Accept invite
    acceptInvite: (inviteId) => api.post(`/api/invites/${inviteId}/accept`),

    // Decline invite
    declineInvite: (inviteId) => api.post(`/api/invites/${inviteId}/decline`),

    // Cancel invite (admin/owner only)
    cancelInvite: (inviteId) => api.delete(`/api/invites/${inviteId}`),

    // Verify invite token (for external users from email link)
    verifyInviteToken: (token) => api.get(`/api/invites/verify/${token}`),

    // Accept invite by token (after registration)
    acceptInviteByToken: (token) => api.post(`/api/invites/accept-token/${token}`)
};
