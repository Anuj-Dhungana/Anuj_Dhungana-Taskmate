import { useEffect, useState, useMemo, useCallback } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, isToday, isBefore, isAfter, addDays, startOfDay, endOfDay } from 'date-fns';
import { enUS } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import '../styles/calendar.css';
import axios from 'axios';
import useWorkspaceStore from '../store/useWorkspaceStore';
import {
    CalendarDays, Clock, Users, Flag, ChevronLeft, ChevronRight,
    X, Calendar as CalendarIcon, CheckCircle2, AlertCircle
} from 'lucide-react';

const locales = { 'en-US': enUS };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });

// Event type colors
const EVENT_COLORS = {
    deadline:  { bg: '#EF4444', light: '#FEF2F2', text: '#991B1B', border: '#FECACA', dot: '#EF4444' },
    meeting:   { bg: '#8B5CF6', light: '#F5F3FF', text: '#5B21B6', border: '#DDD6FE', dot: '#8B5CF6' },
    milestone: { bg: '#10B981', light: '#ECFDF5', text: '#065F46', border: '#A7F3D0', dot: '#10B981' },
};

const toDateAt = (value, hours) => {
    if (!value) return null;
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return null;
    d.setHours(hours, 0, 0, 0);
    return d;
};

// Badge component
const TypeBadge = ({ type }) => {
    const colors = EVENT_COLORS[type] || EVENT_COLORS.deadline;
    return (
        <span
            className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full capitalize"
            style={{ backgroundColor: colors.light, color: colors.text, border: `1px solid ${colors.border}` }}
        >
            {type}
        </span>
    );
};

// Custom calendar toolbar
const CustomToolbar = ({ date, onNavigate, view, onView }) => {
    const label = view === 'month'
        ? format(date, 'MMMM yyyy')
        : view === 'week'
            ? `Week of ${format(date, 'MMM d, yyyy')}`
            : format(date, 'EEEE, MMM d, yyyy');

    return (
        <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
                <button
                    onClick={() => onNavigate('PREV')}
                    className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-500"
                >
                    <ChevronLeft size={18} />
                </button>
                <button
                    onClick={() => onNavigate('TODAY')}
                    className="px-3 py-1 text-xs font-medium rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600 transition-colors"
                >
                    Today
                </button>
                <button
                    onClick={() => onNavigate('NEXT')}
                    className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-500"
                >
                    <ChevronRight size={18} />
                </button>
                <h2 className="text-base font-semibold text-gray-800 ml-2">{label}</h2>
            </div>
            <div className="flex bg-gray-100 p-0.5 rounded-lg">
                {['day', 'week', 'month'].map(v => (
                    <button
                        key={v}
                        onClick={() => onView(v)}
                        className={`px-3 py-1 text-xs font-medium rounded-md capitalize transition-colors ${
                            view === v
                                ? 'bg-white text-indigo-600 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        {v}
                    </button>
                ))}
            </div>
        </div>
    );
};

// Custom event component for month view
const CustomEvent = ({ event }) => {
    const colors = EVENT_COLORS[event.type] || EVENT_COLORS.deadline;
    const tooltip = event.meta?.projectName ? `${event.title} (${event.meta.projectName})` : event.title;
    return (
        <div
            className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-medium truncate cursor-pointer"
            style={{ backgroundColor: colors.light, color: colors.text }}
            title={tooltip}
        >
            <span
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ backgroundColor: colors.dot }}
            />
            <span className="truncate">{event.title}</span>
        </div>
    );
};

// Event detail modal
const EventDetailModal = ({ event, onClose }) => {
    if (!event) return null;
    const meta = event.meta || {};
    const projectName = meta.projectName || event.resource?.projectId?.name || event.resource?.name;
    const listTitle = meta.listTitle || event.resource?.listId?.title;
    const priority = meta.priority || event.resource?.priority;
    const description = meta.description || event.resource?.description;
    const status = event.resource?.status;
    const isProjectEvent = event.source?.startsWith('project');

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-4">
                    <TypeBadge type={event.type} />
                    <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400">
                        <X size={18} />
                    </button>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">{event.title}</h3>

                <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                        <CalendarIcon size={14} />
                        <span>{format(event.start, 'EEEE, MMM d, yyyy')}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Clock size={14} />
                        <span>{format(event.start, 'h:mm a')} – {format(event.end, 'h:mm a')}</span>
                    </div>
                    {projectName && (
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Flag size={14} />
                            <span>Project: {projectName}</span>
                        </div>
                    )}
                    {listTitle && (
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                            <CheckCircle2 size={14} />
                            <span>List: {listTitle}</span>
                        </div>
                    )}
                    {priority && (
                        <div className="flex items-center gap-2 text-sm">
                            <AlertCircle size={14} className={
                                priority === 'High' ? 'text-red-500' :
                                priority === 'Medium' ? 'text-amber-500' : 'text-gray-400'
                            } />
                            <span className="text-gray-500">Priority: {priority}</span>
                        </div>
                    )}
                    {isProjectEvent && status && (
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                            <AlertCircle size={14} className="text-indigo-500" />
                            <span>Status: {status}</span>
                        </div>
                    )}
                    {description && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-xl text-sm text-gray-600">
                            {description}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// ─── MAIN COMPONENT ────────────────────────────────────────────────────────
const WorkspaceCalendar = () => {
    const { currentWorkspaceId } = useWorkspaceStore();
    const [events, setEvents] = useState([]);
    const [view, setView] = useState('month');
    const [date, setDate] = useState(new Date());
    const [loading, setLoading] = useState(true);
    const [selectedEvent, setSelectedEvent] = useState(null);

    const fetchEvents = useCallback(async () => {
        if (!currentWorkspaceId) return;
        setLoading(true);
        try {
            const [projectsRes] = await Promise.allSettled([
                axios.get(`/api/projects?workspaceId=${currentWorkspaceId}`),
            ]);
            const projects = projectsRes.status === 'fulfilled' ? projectsRes.value.data || [] : [];

            const projectEvents = [];
            projects.forEach((project) => {
                if (project?.calendarEnabled === false) {
                    return;
                }
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

            setEvents(projectEvents);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [currentWorkspaceId]);

    useEffect(() => {
        fetchEvents();
    }, [fetchEvents]);

    // Stats computation
    const stats = useMemo(() => {
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
    }, [events]);

    // Side panel items
    const todayItems = useMemo(() => stats.todayEvents, [stats]);
    const upcomingItems = useMemo(() => {
        return events
            .filter(e => isAfter(e.start, endOfDay(new Date())))
            .sort((a, b) => a.start - b.start)
            .slice(0, 10);
    }, [events]);

    // Handlers
    const handleSelectEvent = useCallback((event) => {
        setSelectedEvent(event);
    }, []);

    // Calendar event styling
    const eventStyleGetter = useCallback(() => ({
        style: {
            backgroundColor: 'transparent',
            border: 'none',
            padding: 0,
            margin: 0,
        }
    }), []);

    // Custom day cell wrapper for subtle today highlight
    const dayPropGetter = useCallback((date) => {
        if (isToday(date)) {
            return { style: { backgroundColor: '#F5F3FF' } };
        }
        return {};
    }, []);

    // ─── NO WORKSPACE ──────────────────────────────────────────────────
    if (!currentWorkspaceId) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="text-center">
                    <CalendarDays size={48} className="mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500 font-medium">Select a workspace to view the calendar.</p>
                </div>
            </div>
        );
    }

    // ─── LOADING STATE ─────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="px-8 py-8">
                {/* Skeleton header */}
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <div className="h-7 w-52 bg-gray-200 rounded-lg animate-pulse mb-2" />
                        <div className="h-4 w-72 bg-gray-100 rounded-lg animate-pulse" />
                    </div>
                    <div className="h-9 w-28 bg-gray-200 rounded-xl animate-pulse" />
                </div>
                {/* Skeleton stats */}
                <div className="grid grid-cols-4 gap-4 mb-6">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
                    ))}
                </div>
                {/* Skeleton calendar + sidebar */}
                <div className="flex gap-6">
                    <div className="flex-1 h-[60vh] bg-gray-100 rounded-2xl animate-pulse" />
                    <div className="w-80 space-y-4">
                        <div className="h-48 bg-gray-100 rounded-2xl animate-pulse" />
                        <div className="h-64 bg-gray-100 rounded-2xl animate-pulse" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="px-8 py-8 min-h-screen bg-gray-50/30">
            {/* ─── HEADER ──────────────────────────────────────────────── */}
            <div className="flex items-start justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Workspace Calendar</h1>
                    <p className="text-sm text-gray-500 mt-0.5">High-level view of workspace deadlines and meetings.</p>
                    <p className="text-xs text-gray-400 mt-1">Task due dates appear in Project Calendars and My Tasks.</p>
                </div>
            </div>

            {/* ─── STAT CARDS ──────────────────────────────────────────── */}
            <div className="grid grid-cols-4 gap-4 mb-6">
                {[
                    { label: "Today's Events", value: stats.todayEvents.length, icon: CalendarDays, color: '#3B82F6' },
                    { label: 'Upcoming',        value: stats.upcoming.length,     icon: Clock,        color: '#8B5CF6' },
                    { label: 'Deadlines',       value: stats.deadlines.length,    icon: Flag,         color: '#EF4444' },
                    { label: 'Meetings',        value: stats.meetings.length,     icon: Users,        color: '#F59E0B' },
                ].map((stat, i) => (
                    <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center justify-between">
                        <div>
                            <p className="text-xs text-gray-500 font-medium">{stat.label}</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                        </div>
                        <div className="p-2.5 rounded-xl" style={{ backgroundColor: `${stat.color}10` }}>
                            <stat.icon size={20} style={{ color: stat.color }} />
                        </div>
                    </div>
                ))}
            </div>

            {/* ─── MAIN CONTENT: CALENDAR + SIDE PANEL ─────────────────── */}
            <div className="flex gap-6">
                {/* Calendar (70%) */}
                <div className="flex-1 bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                    <Calendar
                        localizer={localizer}
                        events={events}
                        startAccessor="start"
                        endAccessor="end"
                        style={{ height: '62vh' }}
                        views={['month', 'week', 'day']}
                        view={view}
                        date={date}
                        onView={setView}
                        onNavigate={setDate}
                        onSelectEvent={handleSelectEvent}
                        eventPropGetter={eventStyleGetter}
                        dayPropGetter={dayPropGetter}
                        components={{
                            toolbar: CustomToolbar,
                            event: CustomEvent,
                        }}
                        min={new Date(0, 0, 0, 7, 0, 0)}
                        max={new Date(0, 0, 0, 21, 0, 0)}
                        popup
                        showMultiDayTimes
                    />
                </div>

                {/* Side Panel (30%) */}
                <div className="w-80 shrink-0 space-y-5">
                    {/* Today's Events */}
                    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                        <div className="flex items-center gap-2 mb-4">
                            <CalendarDays size={16} className="text-indigo-500" />
                            <h3 className="text-sm font-bold text-gray-900">Today's Events</h3>
                        </div>
                        {todayItems.length === 0 ? (
                            <p className="text-xs text-gray-400 text-center py-4">No events today</p>
                        ) : (
                            <div className="space-y-2.5">
                                {todayItems.map(event => {
                                    const colors = EVENT_COLORS[event.type] || EVENT_COLORS.deadline;
                                    return (
                                        <div
                                            key={event.id}
                                            onClick={() => setSelectedEvent(event)}
                                            className="p-3 rounded-xl cursor-pointer hover:shadow-sm transition-all"
                                            style={{ backgroundColor: colors.light, borderLeft: `3px solid ${colors.bg}` }}
                                        >
                                            <p className="text-sm font-semibold text-gray-800">{event.title}</p>
                                            <div className="flex items-center gap-3 mt-1.5">
                                                <span className="flex items-center gap-1 text-[11px] text-gray-500">
                                                    <Clock size={11} />
                                                    {format(event.start, 'h:mm a')} · {
                                                        Math.round((event.end - event.start) / (1000 * 60 * 60))}h
                                                </span>
                                            </div>
                                            {event.meta?.projectName && (
                                                <span className="flex items-center gap-1 text-[11px] text-gray-400 mt-1">
                                                    <Flag size={10} /> {event.meta.projectName}
                                                </span>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Upcoming Events (next 7 days) */}
                    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                        <div className="flex items-center gap-2 mb-4">
                            <Clock size={16} className="text-purple-500" />
                            <h3 className="text-sm font-bold text-gray-900">Upcoming Events</h3>
                        </div>
                        {upcomingItems.length === 0 ? (
                            <p className="text-xs text-gray-400 text-center py-4">No upcoming events</p>
                        ) : (
                            <div className="space-y-2.5 max-h-[35vh] overflow-y-auto pr-1">
                                {upcomingItems.map(event => {
                                    const colors = EVENT_COLORS[event.type] || EVENT_COLORS.deadline;
                                    return (
                                        <div
                                            key={event.id}
                                            onClick={() => setSelectedEvent(event)}
                                            className="p-3 rounded-xl cursor-pointer hover:shadow-sm transition-all"
                                            style={{ backgroundColor: colors.light, borderLeft: `3px solid ${colors.bg}` }}
                                        >
                                            <div className="flex items-center justify-between mb-1">
                                                <p className="text-sm font-semibold text-gray-800 truncate mr-2">{event.title}</p>
                                                <TypeBadge type={event.type} />
                                            </div>
                                            <div className="flex items-center gap-3 text-[11px] text-gray-500">
                                                <span className="flex items-center gap-1">
                                                    <CalendarIcon size={11} />
                                                    {format(event.start, 'MMM d, yyyy')}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Clock size={11} />
                                                    {format(event.start, 'h:mm a')}
                                                </span>
                                            </div>
                                            {event.meta?.projectName && (
                                                <div className="flex items-center gap-1 text-[11px] text-gray-400 mt-1">
                                                    <Flag size={10} /> {event.meta.projectName}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Legend */}
                    <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2.5">Legend</p>
                        <div className="grid grid-cols-2 gap-2">
                            {Object.entries(EVENT_COLORS).map(([type, colors]) => (
                                <div key={type} className="flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: colors.bg }} />
                                    <span className="text-xs text-gray-600 capitalize">{type}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* ─── EMPTY STATE OVERLAY ──────────────────────────────────── */}
            {!loading && events.length === 0 && (
                <div className="mt-6 text-center py-12 bg-white rounded-2xl border border-gray-100">
                    <CalendarDays size={48} className="mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500 font-medium mb-1">No workspace events scheduled yet</p>
                    <p className="text-sm text-gray-400 mb-4">Project deadlines and meetings will appear here.</p>
                    <p className="text-xs text-gray-400">Task due dates appear in Project Calendars and My Tasks.</p>
                </div>
            )}

            {/* ─── MODALS ──────────────────────────────────────────────── */}
            <EventDetailModal
                event={selectedEvent}
                onClose={() => setSelectedEvent(null)}
            />
        </div>
    );
};

export default WorkspaceCalendar;
