import { useState, useMemo, useCallback } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, isToday } from 'date-fns';
import { enUS } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import '../styles/calendar.css';
import useWorkspaceStore from '../store/useWorkspaceStore';
import { CalendarDays } from 'lucide-react';
import { useCalendarEvents } from '../hooks/useCalendarEvents';
import { calculateCalendarStats, getUpcomingEvents } from '../utils/calendarHelpers';
import CustomToolbar from '../components/calendar/CustomToolbar';
import CustomEvent from '../components/calendar/CustomEvent';
import EventDetailModal from '../components/calendar/EventDetailModal';
import CalendarStatsCards from '../components/calendar/CalendarStatsCards';
import TodayEventsList from '../components/calendar/TodayEventsList';
import UpcomingEventsList from '../components/calendar/UpcomingEventsList';
import CalendarLegend from '../components/calendar/CalendarLegend';

const locales = { 'en-US': enUS };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });

const WorkspaceCalendar = () => {
    const { currentWorkspaceId } = useWorkspaceStore();
    const [view, setView] = useState('month');
    const [date, setDate] = useState(new Date());
    const [selectedEvent, setSelectedEvent] = useState(null);

    const { events, loading } = useCalendarEvents(currentWorkspaceId);

    const stats = useMemo(() => calculateCalendarStats(events), [events]);
    const todayItems = useMemo(() => stats.todayEvents, [stats]);
    const upcomingItems = useMemo(() => getUpcomingEvents(events), [events]);

    const handleSelectEvent = useCallback((event) => {
        setSelectedEvent(event);
    }, []);

    const eventStyleGetter = useCallback(() => ({
        style: {
            backgroundColor: 'transparent',
            border: 'none',
            padding: 0,
            margin: 0,
        }
    }), []);

    const dayPropGetter = useCallback((date) => {
        if (isToday(date)) {
            return { style: { backgroundColor: '#F5F3FF' } };
        }
        return {};
    }, []);

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

    if (loading) {
        return (
            <div className="px-8 py-8">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <div className="h-7 w-52 bg-gray-200 rounded-lg animate-pulse mb-2" />
                        <div className="h-4 w-72 bg-gray-100 rounded-lg animate-pulse" />
                    </div>
                    <div className="h-9 w-28 bg-gray-200 rounded-xl animate-pulse" />
                </div>
                <div className="grid grid-cols-4 gap-4 mb-6">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
                    ))}
                </div>
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
            <div className="flex items-start justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Workspace Calendar</h1>
                    <p className="text-sm text-gray-500 mt-0.5">High-level view of workspace deadlines and meetings.</p>
                    <p className="text-xs text-gray-400 mt-1">Task due dates appear in Project Calendars and My Tasks.</p>
                </div>
            </div>

            <CalendarStatsCards stats={stats} />

            <div className="flex gap-6">
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

                <div className="w-80 shrink-0 space-y-5">
                    <TodayEventsList events={todayItems} onEventClick={setSelectedEvent} />
                    <UpcomingEventsList events={upcomingItems} onEventClick={setSelectedEvent} />
                    <CalendarLegend />
                </div>
            </div>

            {!loading && events.length === 0 && (
                <div className="mt-6 text-center py-12 bg-white rounded-2xl border border-gray-100">
                    <CalendarDays size={48} className="mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500 font-medium mb-1">No workspace events scheduled yet</p>
                    <p className="text-sm text-gray-400 mb-4">Project deadlines and meetings will appear here.</p>
                    <p className="text-xs text-gray-400">Task due dates appear in Project Calendars and My Tasks.</p>
                </div>
            )}

            <EventDetailModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />
        </div>
    );
};

export default WorkspaceCalendar;