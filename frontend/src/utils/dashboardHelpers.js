/**
 * Dashboard helper utilities
 */

export const STATUS_COLORS = {
    Planning: 'bg-blue-100 text-blue-700 border-blue-200',
    Active: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    Completed: 'bg-gray-100 text-gray-600 border-gray-200',
    'On Hold': 'bg-amber-100 text-amber-700 border-amber-200',
};

export const PRIORITY_COLORS = {
    High: 'bg-red-500',
    Medium: 'bg-amber-400',
    Low: 'bg-blue-400',
};

export const getStatusColor = (status) => STATUS_COLORS[status] || STATUS_COLORS.Planning;
export const getPriorityColor = (priority) => PRIORITY_COLORS[priority] || PRIORITY_COLORS.Medium;

export const timeAgo = (date) => {
    if (!date) return '';
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return 'just now';
    const mins = Math.floor(seconds / 60);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

export const formatShortDate = (date) => {
    if (!date) return '—';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '—';
    const now = new Date();
    const isThisYear = d.getFullYear() === now.getFullYear();
    return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        ...(isThisYear ? {} : { year: 'numeric' }),
    });
};

export const isOverdue = (dueDate) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date() && new Date(dueDate).toDateString() !== new Date().toDateString();
};

export const isDueToday = (dueDate) => {
    if (!dueDate) return false;
    return new Date(dueDate).toDateString() === new Date().toDateString();
};

export const isDueThisWeek = (dueDate) => {
    if (!dueDate) return false;
    const d = new Date(dueDate);
    const now = new Date();
    const endOfWeek = new Date(now);
    endOfWeek.setDate(now.getDate() + (7 - now.getDay()));
    endOfWeek.setHours(23, 59, 59, 999);
    return d > now && d <= endOfWeek;
};

export const getProjectProgress = (project, cards) => {
    const projectCards = cards.filter((c) => {
        const pid = c.projectId?._id || c.projectId;
        return pid?.toString() === project._id?.toString();
    });
    const total = projectCards.length;
    if (total === 0) return { done: 0, total: 0, percent: 0 };
    const done = projectCards.filter((c) => {
        const listTitle = (c.listId?.title || '').toLowerCase();
        return listTitle === 'done';
    }).length;
    return { done, total, percent: Math.round((done / total) * 100) };
};

export const groupUpcomingByDay = (items) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const dayAfterTomorrow = new Date(today);
    dayAfterTomorrow.setDate(today.getDate() + 2);
    const endOfWeek = new Date(today);
    endOfWeek.setDate(today.getDate() + 7);

    const groups = { today: [], tomorrow: [], later: [] };

    items.forEach((item) => {
        const d = new Date(item.date);
        if (d >= today && d < tomorrow) groups.today.push(item);
        else if (d >= tomorrow && d < dayAfterTomorrow) groups.tomorrow.push(item);
        else if (d >= dayAfterTomorrow && d < endOfWeek) groups.later.push(item);
    });

    return groups;
};

export const computeDashboardStats = (projects, cards, allCards, members) => {
    const totalProjects = projects.length;
    const activeProjects = projects.filter((p) => p.status === 'Active').length;

    const doneCards = allCards.filter((c) => {
        const listTitle = (c.listId?.title || '').toLowerCase();
        return listTitle === 'done';
    });
    const openTasks = allCards.length - doneCards.length;
    const completedTasks = doneCards.length;

    const overdueTasks = allCards.filter((c) => {
        const listTitle = (c.listId?.title || '').toLowerCase();
        return listTitle !== 'done' && isOverdue(c.dueDate);
    }).length;

    const dueThisWeek = allCards.filter((c) => {
        const listTitle = (c.listId?.title || '').toLowerCase();
        return listTitle !== 'done' && (isDueThisWeek(c.dueDate) || isDueToday(c.dueDate));
    }).length;

    const totalMembers = members.length;
    const adminCount = members.filter((m) => ['owner', 'admin'].includes(m.role)).length;

    return { totalProjects, activeProjects, openTasks, completedTasks, overdueTasks, dueThisWeek, totalMembers, adminCount };
};
