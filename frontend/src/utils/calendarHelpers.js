import { format, startOfDay, endOfDay, addDays, isBefore, isAfter } from 'date-fns';

// Event type colors
export const EVENT_COLORS = {
    deadline: { bg: '#EF4444', light: '#FEF2F2', text: '#991B1B', border: '#FECACA', dot: '#EF4444' },
    meeting: { bg: '#8B5CF6', light: '#F5F3FF', text: '#5B21B6', border: '#DDD6FE', dot: '#8B5CF6' },
    milestone: { bg: '#10B981', light: '#ECFDF5', text: '#065F46', border: '#A7F3D0', dot: '#10B981' },
};

/**
 * Convert a date value to a Date object at specific hour
 */
export const toDateAt = (value, hours) => {
    if (!value) return null;
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return null;
    d.setHours(hours, 0, 0, 0);
    return d;
};

/**
 * Process projects into calendar events
 */
export const processProjectEvents = (projects) => {
    const projectEvents = [];

    projects.forEach((project) => {
        if (project?.calendarEnabled === false) {
            return;
        }

        // Add deadline event
        const deadlineValue = project?.endDate || project?.dueDate;
        if (deadlineValue) {
            const startDate = toDateAt(deadlineValue, 11);
            if (startDate) {
                const endDate = new Date(startDate);
                endDate.setHours(12, 0, 0, 0);
                projectEvents.push({
                    id: `project-deadline-${project._id}`,
                    title: `${project.name} — Project Deadline`,
                    start: startDate,
                    end: endDate,
                    allDay: false,
                    type: 'deadline',
                    source: 'project-deadline',
                    resource: project,
                    meta: { projectName: project.name },
                });
            }
        }

        // Add start date event
        if (project?.startDate) {
            const startDate = toDateAt(project.startDate, 8);
            if (startDate) {
                const endDate = new Date(startDate);
                endDate.setHours(9, 0, 0, 0);
                projectEvents.push({
                    id: `project-start-${project._id}`,
                    title: `${project.name} — Project Start`,
                    start: startDate,
                    end: endDate,
                    allDay: false,
                    type: 'milestone',
                    source: 'project-start',
                    resource: project,
                    meta: { projectName: project.name },
                });
            }
        }
    });

    return projectEvents;
};

/**
 * Calculate calendar statistics
 */
export const calculateCalendarStats = (events) => {
    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);
    const weekEnd = addDays(now, 7);

    const todayEvents = events.filter(e => e.start >= todayStart && e.start <= todayEnd);
    const upcoming = events.filter(e => isAfter(e.start, todayEnd) && isBefore(e.start, weekEnd));
    const meetings = events.filter(e => e.type === 'meeting');
    const deadlines = events.filter(e => e.type === 'deadline');
    const milestones = events.filter(e => e.type === 'milestone');

    return { todayEvents, upcoming, meetings, deadlines, milestones };
};

/**
 * Get upcoming events sorted by date
 */
export const getUpcomingEvents = (events, limit = 10) => {
    return events
        .filter(e => isAfter(e.start, endOfDay(new Date())))
        .sort((a, b) => a.start - b.start)
        .slice(0, limit);
};

/**
 * Format event duration in hours
 */
export const formatEventDuration = (start, end) => {
    const hours = Math.round((end - start) / (1000 * 60 * 60));
    return `${hours}h`;
};

/**
 * Get toolbar label based on view and date
 */
export const getToolbarLabel = (date, view) => {
    if (view === 'month') {
        return format(date, 'MMMM yyyy');
    } else if (view === 'week') {
        return `Week of ${format(date, 'MMM d, yyyy')}`;
    } else {
        return format(date, 'EEEE, MMM d, yyyy');
    }
};
