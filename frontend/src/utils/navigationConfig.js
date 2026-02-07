import { Grid, TrendingUp, ListChecks, Calendar, Users, BarChart3, MessageSquare, Phone, Settings } from 'lucide-react';

export const NAV_GROUPS = [
    {
        label: 'Workspace',
        items: [
            { to: '/dashboard', label: 'Dashboard', icon: BarChart3 },
            { to: '/projects', label: 'Projects', icon: Grid },
            { to: '/tasks', label: 'My Tasks', icon: ListChecks },
            { to: '/calendar', label: 'Calendar', icon: Calendar },
            { to: '/members', label: 'Members', icon: Users },
        ],
    },
    {
        label: 'Collaboration',
        items: [
            { to: '/chat', label: 'Chat', icon: MessageSquare },
            { to: '/calls', label: 'Calls', icon: Phone },
        ],
    },
    {
        label: 'Insights',
        items: [
            { to: '/analytics', label: 'Analytics', icon: TrendingUp },
        ],
    },
];

export const SYSTEM_ITEMS = [
    { to: '/settings', label: 'Settings', icon: Settings },
];

/**
 * Get user role from workspace members
 */
export const getUserRole = (workspace, userId) => {
    const members = workspace?.workspace?.members || [];
    const me = members.find((m) => m.user?._id === userId);
    return me?.role ? `${me.role[0].toUpperCase()}${me.role.slice(1)}` : 'Member';
};
