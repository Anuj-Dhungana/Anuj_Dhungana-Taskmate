import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { useState, useEffect } from 'react';
import axios from 'axios';

// Setup Localizer
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

const ProjectCalendar = ({ projectId }) => {
    const [events, setEvents] = useState([]);
    const [view, setView] = useState('month');
    const [date, setDate] = useState(new Date());

    useEffect(() => {
        const fetchCards = async () => {
            if (!projectId) return;
            setEvents([]);
            try {
                const res = await axios.get(`/api/board/${projectId}`);
                const cards = res.data?.cards || [];

                const calendarEvents = cards
                    .filter((card) => card.dueDate)
                    .map((card) => {
                        const startDate = new Date(card.dueDate);
                        if (Number.isNaN(startDate.getTime())) return null;

                        startDate.setHours(9, 0, 0);
                        const endDate = new Date(startDate);
                        endDate.setHours(10, 0, 0);

                        return {
                            id: card._id,
                            title: card.title,
                            start: startDate,
                            end: endDate,
                            allDay: false,
                            resource: card
                        };
                    })
                    .filter(Boolean);

                setEvents(calendarEvents);
            } catch (err) {
                console.error('Failed to load project calendar', err);
            }
        };
        fetchCards();
    }, [projectId]);

    const eventStyleGetter = (event) => {
        return {
            style: {
                backgroundColor: '#2563EB',
                borderRadius: '4px',
                opacity: 0.8,
                color: 'white',
                border: '0px',
                display: 'block'
            }
        };
    };

    return (
        <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="h-[70vh]">
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
                    onSelectEvent={(event) => alert(`${event.title}`)}
                    
                    min={new Date(0, 0, 0, 8, 0, 0)} 
                    max={new Date(0, 0, 0, 20, 0, 0)}
                />
            </div>
        </div>
    );
};

export default ProjectCalendar;
