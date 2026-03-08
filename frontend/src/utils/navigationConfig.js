import { Folder, TrendingUp, ListChecks, Calendar, Users, BarChart3, MessageSquare, Phone, Settings } from 'lucide-react';

export const NAV_GROUPS = [
    {
        label: 'Workspace',
        items: [
            { to: '/dashboard', label: 'Dashboard', icon: BarChart3 },
            { to: '/projects', label: 'Projects', icon: Folder },
            { to: '/tasks', label: 'My Tasks', icon: ListChecks },
            { to: '/calendar', label: 'Calendar', icon: Calendar },
            { to: '/members', label: 'Members', icon: Users, requiredRoles: ['owner', 'admin'] },
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
            { to: '/analytics', label: 'Analytics', icon: TrendingUp, requiredRoles: ['owner', 'admin'] },
        ],
    },
];

export const SYSTEM_ITEMS = [
    { to: '/settings', label: 'Settings', icon: Settings, requiredRoles: ['owner'] },
];

/**
 * Get user role from workspace members
 */
export const getUserRole = (workspace, userId) => {
    const members = workspace?.workspace?.members || [];
    const me = members.find((m) => m.user?._id === userId);
    return me?.role ? `${me.role[0].toUpperCase()}${me.role.slice(1)}` : 'Member';
};

/**
 * Get raw (lowercase) user role string from workspace members
 */
export const getUserRoleRaw = (workspace, userId) => {
    const members = workspace?.workspace?.members || [];
    const me = members.find((m) => m.user?._id === userId);
    return me?.role || 'member';
};

/**
 * Filter nav items by the current user's role.
 * Items without requiredRoles are visible to everyone.
 */
export const filterNavByRole = (groups, role) => {
    const r = (role || 'member').toLowerCase();
    return groups
        .map((group) => ({
            ...group,
            items: group.items.filter(
                (item) => !item.requiredRoles || item.requiredRoles.includes(r)
            ),
        }))
        .filter((group) => group.items.length > 0);
};

/**
 * Filter system items by role
 */
export const filterSystemByRole = (items, role) => {
    const r = (role || 'member').toLowerCase();
    return items.filter(
        (item) => !item.requiredRoles || item.requiredRoles.includes(r)
    );
};
