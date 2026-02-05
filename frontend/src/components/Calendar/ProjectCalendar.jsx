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
            try {
                const res = await axios.get(`/api/board/${projectId}`);
                const cards = res.data.cards;

                const calendarEvents = cards
                    .filter(card => card.dueDate)
                    .map(card => {
                        // 1. Create a Date object from the due date
                        const startDate = new Date(card.dueDate);
                        
                        // 2. Force time to 9:00 AM (so it shows up nicely in Week view)
                       
                        startDate.setHours(9, 0, 0);

                        // 3. Set End time to 10:00 AM (1 hour duration)
                        const endDate = new Date(startDate);
                        endDate.setHours(10, 0, 0);

                        return {
                            id: card._id,
                            title: card.title,
                            start: startDate,
                            end: endDate,
                            allDay: false, // <--- CHANGED: Shows in the time grid now
                            resource: card
                        };
                    });

                setEvents(calendarEvents);
            } catch (err) {
                console.error(err);
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
        <div className="h-full bg-white p-4 rounded-lg shadow-sm flex flex-col">
            {/* The wrapper div needs flex-1 to fill the space properly */}
            <div className="flex-1" style={{ minHeight: '500px' }}>
                <Calendar
                    localizer={localizer}
                    events={events}
                    startAccessor="start"
                    endAccessor="end"
                    style={{ height: '100%' }} // Fill the parent
                    views={['month', 'week', 'day']}
                    view={view} // Controlled view
                    date={date} // Controlled date
                    onView={(newView) => setView(newView)} // Update view state
                    onNavigate={(newDate) => setDate(newDate)} // Update date state
                    eventPropGetter={eventStyleGetter}
                    onSelectEvent={(event) => alert(`${event.title}`)}
                    
                    // Fix for "Week" view: Sets the earliest time shown to 8am
                    min={new Date(0, 0, 0, 8, 0, 0)} 
                    // Sets the latest time shown to 8pm
                    max={new Date(0, 0, 0, 20, 0, 0)}
                />
            </div>
        </div>
    );
};

export default ProjectCalendar;