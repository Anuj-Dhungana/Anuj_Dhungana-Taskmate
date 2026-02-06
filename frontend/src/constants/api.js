// API Base URL
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// API Endpoints
export const ENDPOINTS = {
    // Authentication
    AUTH: {
        REGISTER: '/api/auth/register',
        LOGIN: '/api/auth/login',
        LOGIN_2FA: '/api/auth/login-2fa',
        LOGOUT: '/api/auth/logout',
        FORGOT_PASSWORD: '/api/auth/forgot-password',
        RESET_PASSWORD: '/api/auth/reset-password',
        PROFILE: '/api/auth/profile',
        TOGGLE_2FA: '/api/auth/2fa/toggle',
    },
    
    // Workspaces
    WORKSPACES: {
        BASE: '/api/workspaces',
        BY_ID: (id) => `/api/workspaces/${id}`,
        INVITE: (id) => `/api/workspaces/${id}/invite`,
        ROLE: (id) => `/api/workspaces/${id}/role`,
        REMOVE_MEMBER: (id, userId) => `/api/workspaces/${id}/members/${userId}`,
    },
    
    // Projects
    PROJECTS: {
        BASE: '/api/projects',
        BY_WORKSPACE: (workspaceId) => `/api/projects?workspaceId=${workspaceId}`,
        BY_ID: (id) => `/api/projects/${id}`,
    },
    
    // Board
    BOARD: {
        BY_PROJECT: (projectId) => `/api/board/${projectId}`,
        WORKSPACE_STATS: (workspaceId) => `/api/board/workspace-stats?workspaceId=${workspaceId}`,
        WORKSPACE_ANALYTICS: (workspaceId) => `/api/board/workspace-analytics?workspaceId=${workspaceId}`,
        MY_TASKS: (workspaceId) => `/api/board/my-tasks?workspaceId=${workspaceId}`,
        LISTS: '/api/board/lists',
        LIST_BY_ID: (id) => `/api/board/lists/${id}`,
        CARDS: '/api/board/cards',
        CARD_BY_ID: (id) => `/api/board/cards/${id}`,
        REORDER_CARDS: '/api/board/cards/reorder',
    },
    
    // Messages
    MESSAGES: {
        BASE: '/api/messages',
        BY_CHANNEL: (channelId) => `/api/messages/${channelId}`,
        BY_ID: (id) => `/api/messages/${id}`,
    },
    
    // Notifications
    NOTIFICATIONS: {
        BASE: '/api/notifications',
        BY_ID: (id) => `/api/notifications/${id}`,
        MARK_READ: (id) => `/api/notifications/${id}/read`,
        READ_ALL: '/api/notifications/read-all',
    },
};
