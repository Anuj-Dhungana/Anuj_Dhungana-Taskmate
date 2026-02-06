// Application route paths
export const ROUTES = {
    // Public routes
    HOME: '/',
    LOGIN: '/login',
    REGISTER: '/register',
    FORGOT_PASSWORD: '/forgot-password',
    RESET_PASSWORD: '/reset-password/:token',
    VERIFY_EMAIL: '/verify-email',
    
    // Protected routes
    DASHBOARD: '/dashboard',
    PROFILE: '/profile',
    SETTINGS: '/settings',
    
    // Workspace routes
    WORKSPACES: '/workspaces',
    WORKSPACE_DETAIL: '/workspace/:workspaceId',
    WORKSPACE_MEMBERS: '/workspace/:workspaceId/members',
    WORKSPACE_CHAT: '/workspace/:workspaceId/chat',
    WORKSPACE_CALLS: '/workspace/:workspaceId/calls',
    WORKSPACE_CALENDAR: '/workspace/:workspaceId/calendar',
    
    // Project routes
    PROJECT_VIEW: '/project/:projectId',
    
    // Task routes
    MY_TASKS: '/my-tasks',
    
    // Analytics
    ANALYTICS: '/analytics',
};

// Helper to build dynamic routes
export const buildRoute = {
    workspaceDetail: (workspaceId) => `/workspace/${workspaceId}`,
    workspaceMembers: (workspaceId) => `/workspace/${workspaceId}/members`,
    workspaceChat: (workspaceId) => `/workspace/${workspaceId}/chat`,
    workspaceCalls: (workspaceId) => `/workspace/${workspaceId}/calls`,
    workspaceCalendar: (workspaceId) => `/workspace/${workspaceId}/calendar`,
    projectView: (projectId) => `/project/${projectId}`,
    resetPassword: (token) => `/reset-password/${token}`,
};
