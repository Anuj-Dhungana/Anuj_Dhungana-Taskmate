// Project utility functions

export const normalizeStatus = (status) => {
    const value = (status || 'Planning').toLowerCase();
    if (value === 'in progress' || value === 'active') return 'active';
    if (value === 'planning') return 'planning';
    if (value === 'completed') return 'completed';
    return value;
};

export const getStatusUi = (status) => {
    const normalized = normalizeStatus(status);

    if (normalized === 'active') {
        return {
            label: 'Active',
            badge: 'bg-green-100 text-green-700 border-green-200',
            progress: 'bg-green-500',
        };
    }

    if (normalized === 'completed') {
        return {
            label: 'Completed',
            badge: 'bg-indigo-100 text-indigo-700 border-indigo-200',
            progress: 'bg-indigo-500',
        };
    }

    if (normalized === 'planning') {
        return {
            label: 'Planning',
            badge: 'bg-amber-100 text-amber-700 border-amber-200',
            progress: 'bg-amber-500',
        };
    }

    if (normalized === 'on hold') {
        return {
            label: 'On Hold',
            badge: 'bg-slate-100 text-slate-700 border-slate-200',
            progress: 'bg-slate-500',
        };
    }

    return {
        label: status || 'Planning',
        badge: 'bg-blue-100 text-blue-700 border-blue-200',
        progress: 'bg-blue-500',
    };
};

export const getStatusAccentColor = (status) => {
    const normalized = normalizeStatus(status);
    if (normalized === 'active') return '#22C55E';
    if (normalized === 'completed') return '#6366F1';
    if (normalized === 'planning') return '#F59E0B';
    if (normalized === 'on hold') return '#64748B';
    return '#3B82F6';
};

export const getProjectAccentColor = (project) => {
    const raw = typeof project?.projectColor === 'string' ? project.projectColor.trim() : '';
    if (/^#(?:[0-9a-fA-F]{3}){1,2}$/.test(raw)) return raw;
    return getStatusAccentColor(project?.status);
};

export const getPriority = (project) => {
    const fromField = typeof project?.priority === 'string' ? project.priority : '';
    const fromTags = Array.isArray(project?.tags)
        ? project.tags.find((t) => ['high', 'medium', 'low'].includes(String(t).toLowerCase())) || ''
        : '';

    const raw = (fromField || fromTags || 'Medium').toLowerCase();
    if (raw === 'high') return 'High';
    if (raw === 'low') return 'Low';
    return 'Medium';
};

export const getPriorityUi = (priority) => {
    if (priority === 'High') return 'bg-transparent text-red-600 border-red-300';
    if (priority === 'Low') return 'bg-transparent text-slate-600 border-slate-300';
    return 'bg-transparent text-blue-700 border-blue-300';
};

export const formatDueDate = (value) => {
    if (!value) return 'No end date';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return 'No end date';
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};

export const calculateProjectStats = (projects) => {
    const totalProjects = projects.length;
    const active = projects.filter((p) => normalizeStatus(p.status) === 'active').length;
    const completed = projects.filter((p) => normalizeStatus(p.status) === 'completed').length;
    const behindSchedule = projects.filter((p) => p.behindSchedule).length;

    return { totalProjects, active, completed, behindSchedule };
};

export const getProjectLabel = (project) => {
    const tags = Array.isArray(project?.tags) ? project.tags : [];
    
    // Filter out priority tags (low, medium, high)
    const priorityWords = ['low', 'medium', 'high'];
    const labelTags = tags.filter((tag) => {
        const normalized = String(tag || '').trim().toLowerCase();
        return normalized && !priorityWords.includes(normalized);
    });

    // Return the first non-priority tag as the label
    return labelTags.length > 0 ? labelTags[0] : '';
};

// Helper to convert hex color to rgba with opacity
export const hexToRgba = (hex, alpha = 1) => {
    const cleanHex = hex.replace('#', '');
    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

// Helper to generate label styles based on project color
export const getProjectLabelStyles = (accentColor) => {
    if (!accentColor) {
        return {
            backgroundColor: 'rgb(243, 244, 246)',
            color: 'rgb(75, 85, 99)',
            borderColor: 'rgb(229, 231, 235)'
        };
    }
    
    return {
        backgroundColor: hexToRgba(accentColor, 0.1),
        color: accentColor,
        borderColor: hexToRgba(accentColor, 0.3)
    };
};
