import { useEffect, useState } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import axios from 'axios';
import useWorkspaceStore from '../store/useWorkspaceStore';

const locales = {
  'en-US': enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const WorkspaceCalendar = () => {
    const { currentWorkspaceId } = useWorkspaceStore();
    const [events, setEvents] = useState([]);
    const [view, setView] = useState('month');
    const [date, setDate] = useState(new Date());

    useEffect(() => {
        const fetchCards = async () => {
            if (!currentWorkspaceId) return;
            setEvents([]);
            try {
                const res = await axios.get(`/api/board/workspace-cards?workspaceId=${currentWorkspaceId}`);
                const cards = res.data || [];

                const calendarEvents = cards
                    .filter(card => card.dueDate)
                    .map(card => {
                        const startDate = new Date(card.dueDate);
                        startDate.setHours(9, 0, 0);
                        const endDate = new Date(startDate);
                        endDate.setHours(10, 0, 0);

                        return {
                            id: card._id,
                            title: `${card.title}${card.projectId?.name ? ` • ${card.projectId.name}` : ''}`,
                            start: startDate,
                            end: endDate,
                            allDay: false,
                            resource: card,
                        };
                    });

                setEvents(calendarEvents);
            } catch (err) {
                console.error(err);
            }
        };
        fetchCards();
    }, [currentWorkspaceId]);

    if (!currentWorkspaceId) {
        return (
            <div className="px-8 py-10">
                <div className="text-center text-gray-500">Select a workspace to view the calendar.</div>
            </div>
        );
    }

    const eventStyleGetter = () => ({
        style: {
            backgroundColor: '#2563EB',
            borderRadius: '4px',
            opacity: 0.85,
            color: 'white',
            border: '0px',
            display: 'block'
        }
    });

    return (
        <div className="px-8 py-10">
            <div className="mb-4">
                <h1 className="text-2xl font-bold text-gray-900">Workspace Calendar</h1>
                <p className="text-sm text-gray-500">Task deadlines for the selected workspace.</p>
            </div>
            <div className="h-[70vh] bg-white p-4 rounded-lg shadow-sm">
                <Calendar
                    localizer={localizer}
                    events={events}
                    startAccessor="start"
                    endAccessor="end"
                    style={{ height: '100%' }}
                    views={['month', 'week', 'day']}
                    view={view}
                    date={date}
                    onView={(newView) => setView(newView)}
                    onNavigate={(newDate) => setDate(newDate)}
                    eventPropGetter={eventStyleGetter}
                    min={new Date(0, 0, 0, 8, 0, 0)}
                    max={new Date(0, 0, 0, 20, 0, 0)}
                />
            </div>
        </div>
    );
};

export default WorkspaceCalendar;
