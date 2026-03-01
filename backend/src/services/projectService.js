export const sanitizeProjectMembers = (members = [], workspaceMemberIds = []) => {
    if (!Array.isArray(members)) return [];
    return members
        .filter((member) => member?.user && workspaceMemberIds.includes(member.user.toString()))
        .map((member) => ({
            user: member.user,
            role: ['Manager', 'Contributor', 'Viewer'].includes(member.role)
                ? member.role
                : 'Contributor',
        }));
};

export const normalizeProjectTags = (tags = []) => {
    if (!Array.isArray(tags)) return [];
    return tags
        .map((tag) => (typeof tag === 'string' ? tag.trim() : ''))
        .filter(Boolean);
};

export const normalizeProjectColor = (projectColor, fallback) => {
    if (
        typeof projectColor === 'string' &&
        /^#(?:[0-9a-fA-F]{3}){1,2}$/.test(projectColor.trim())
    ) {
        return projectColor.trim();
    }
    return fallback;
};

export const normalizePriority = (priority, fallback = 'Medium') =>
    ['Low', 'Medium', 'High'].includes(priority) ? priority : fallback;

export const toDateOrUndefined = (value) => (value ? new Date(value) : undefined);
