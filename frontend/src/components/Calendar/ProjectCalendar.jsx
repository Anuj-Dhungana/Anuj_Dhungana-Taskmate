import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import enUS from 'date-fns/locale/en-US';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { useState, useEffect } from 'react';
import axios from 'axios';

// Setup Localizer (Required for the library to handle dates)
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

    useEffect(() => {
        const fetchCards = async () => {
            try {
                // Reuse the board API to get cards
                const res = await axios.get(`/api/board/${projectId}`);
                const cards = res.data.cards;

                // Transform Cards into Calendar Events
                const calendarEvents = cards
                    .filter(card => card.dueDate) // Only cards with dates
                    .map(card => ({
                        id: card._id,
                        title: card.title,
                        start: new Date(card.dueDate),
                        end: new Date(card.dueDate), // One-day event by default
                        allDay: true,
                        resource: card
                    }));

                setEvents(calendarEvents);
            } catch (err) {
                console.error(err);
            }
        };
        fetchCards();
    }, [projectId]);

    // Custom Style for Event Bars
    const eventStyleGetter = (event) => {
        return {
            style: {
                backgroundColor: '#2563EB', // Blue-600
                borderRadius: '4px',
                opacity: 0.8,
                color: 'white',
                border: '0px',
                display: 'block'
            }
        };
    };

    return (
        <div className="h-full bg-white p-4 rounded-lg shadow-sm">
            <Calendar
                localizer={localizer}
                events={events}
                startAccessor="start"
                endAccessor="end"
                style={{ height: 'calc(100vh - 200px)' }} // Adjust height dynamically
                views={['month', 'week', 'day']}
                defaultView="month"
                eventPropGetter={eventStyleGetter}
                onSelectEvent={(event) => alert(`Task: ${event.title}\nDue: ${event.start.toDateString()}`)}
            />
        </div>
    );
};

export default ProjectCalendar;