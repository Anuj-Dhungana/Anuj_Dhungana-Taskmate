// ── Style maps ─────────────────────────────────────────────────────────────

export const PRIORITY_STYLES = {
    High: 'bg-red-50 text-red-600 border border-red-200',
    Medium: 'bg-amber-50 text-amber-600 border border-amber-200',
    Low: 'bg-gray-50 text-gray-600 border border-gray-200',
};

export const STATUS_STYLES = {
    todo: 'bg-gray-100 text-gray-600',
    inprogress: 'bg-blue-100 text-blue-700',
    completed: 'bg-emerald-100 text-emerald-700',
};

export const PRIORITY_RANK = { High: 0, Medium: 1, Low: 2 };

// ── Pure helpers ────────────────────────────────────────────────────────────

export const toPriority = (value) => {
    const normalized = String(value || 'Medium').toLowerCase();
    if (normalized === 'high') return 'High';
    if (normalized === 'low') return 'Low';
    return 'Medium';
};

const startOfDay = (value) => {
    const date = new Date(value);
    date.setHours(0, 0, 0, 0);
    return date;
};

export const dayDiff = (fromDate, toDate) => {
    const from = startOfDay(fromDate).getTime();
    const to = startOfDay(toDate).getTime();
    return Math.round((to - from) / (1000 * 60 * 60 * 24));
};

export const getProjectId = (task) =>
    String(task?.projectId?._id || task?.projectId || '');

export const getListTitle = (task) =>
    String(task?.listId?.title || '').trim();

export const getSubtaskStats = (task) => {
    const subtasks = task?.subtasks || [];
    const done = subtasks.filter((item) => !!item?.done).length;
    return { done, total: subtasks.length };
};

export const getTaskStatus = (task) => {
    const title = getListTitle(task).toLowerCase();
    if (title.includes('done') || title.includes('complete')) return 'completed';
    if (title.includes('progress')) return 'inprogress';
    return 'todo';
};

export const getUrgency = (task, now = new Date()) => {
    const status = getTaskStatus(task);
    if (status === 'completed') return 'completed';
    if (!task?.dueDate) return 'upcoming';
    const due = new Date(task.dueDate);
    if (Number.isNaN(due.getTime())) return 'upcoming';
    const diff = dayDiff(now, due);
    if (diff < 0) return 'overdue';
    if (diff <= 3) return 'dueSoon';
    return 'upcoming';
};

export const getDueMeta = (task, now = new Date()) => {
    if (!task?.dueDate) return { text: 'No due date', tone: 'text-gray-400' };
    const due = new Date(task.dueDate);
    if (Number.isNaN(due.getTime())) return { text: 'No due date', tone: 'text-gray-400' };
    const diff = dayDiff(now, due);
    if (diff < 0) return { text: `Overdue by ${Math.abs(diff)}d`, tone: 'text-red-600 font-semibold' };
    if (diff === 0) return { text: 'Due Today', tone: 'text-amber-600 font-semibold' };
    return { text: `Due in ${diff}d`, tone: 'text-gray-500' };
};

export const initialsFromName = (name = '') =>
    String(name)
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0])
        .join('')
        .toUpperCase() || 'U';
