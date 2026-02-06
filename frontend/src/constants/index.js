// User roles
export const USER_ROLES = {
    ADMIN: 'admin',
    MEMBER: 'member',
    VIEWER: 'viewer',
};

// Role labels
export const ROLE_LABELS = {
    [USER_ROLES.ADMIN]: 'Admin',
    [USER_ROLES.MEMBER]: 'Member',
    [USER_ROLES.VIEWER]: 'Viewer',
};

// Task/Card priorities
export const TASK_PRIORITIES = {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    URGENT: 'urgent',
};

// Priority colors
export const PRIORITY_COLORS = {
    [TASK_PRIORITIES.LOW]: 'text-gray-500',
    [TASK_PRIORITIES.MEDIUM]: 'text-blue-500',
    [TASK_PRIORITIES.HIGH]: 'text-orange-500',
    [TASK_PRIORITIES.URGENT]: 'text-red-500',
};

// Card status
export const CARD_STATUS = {
    TODO: 'todo',
    IN_PROGRESS: 'in_progress',
    REVIEW: 'review',
    DONE: 'done',
};

// Local storage keys
export const STORAGE_KEYS = {
    USER_INFO: 'userInfo',
    CURRENT_WORKSPACE_ID: 'currentWorkspaceId',
    SIDEBAR_COLLAPSED: 'sidebarCollapsed',
    THEME: 'theme',
};

// Validation constants
export const VALIDATION = {
    MIN_PASSWORD_LENGTH: 6,
    MAX_PASSWORD_LENGTH: 128,
    MIN_NAME_LENGTH: 2,
    MAX_NAME_LENGTH: 50,
    MAX_DESCRIPTION_LENGTH: 500,
    MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
};

// Socket events
export const SOCKET_EVENTS = {
    // Connection
    CONNECT: 'connect',
    DISCONNECT: 'disconnect',
    
    // Messages
    MESSAGE_RECEIVED: 'messageReceived',
    MESSAGE_DELETED: 'messageDeleted',
    SEND_MESSAGE: 'sendMessage',
    
    // Notifications
    NEW_NOTIFICATION: 'newNotification',
    
    // Board updates
    CARD_UPDATED: 'cardUpdated',
    LIST_UPDATED: 'listUpdated',
};

// Date formats
export const DATE_FORMATS = {
    DISPLAY: 'MMM DD, YYYY',
    FULL: 'MMMM DD, YYYY HH:mm',
    SHORT: 'MM/DD/YYYY',
    TIME: 'HH:mm',
};
