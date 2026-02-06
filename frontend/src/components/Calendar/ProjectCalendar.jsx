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

const EVENT_COLORS = {
  task: { bg: '#3B82F6' },
  deadline: { bg: '#EF4444' },
  milestone: { bg: '#10B981' },
};

const toDateAt = (value, hours) => {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  d.setHours(hours, 0, 0, 0);
  return d;
};

const ProjectCalendar = ({ projectId }) => {
    const [events, setEvents] = useState([]);
    const [view, setView] = useState('month');
    const [date, setDate] = useState(new Date());

    useEffect(() => {
        const fetchCalendarData = async () => {
            if (!projectId) return;
            setEvents([]);
            try {
                const [boardRes, projectRes] = await Promise.allSettled([
                    axios.get(`/api/board/${projectId}`),
                    axios.get(`/api/projects/${projectId}`),
                ]);
                const cards = boardRes.status === 'fulfilled' ? boardRes.value.data?.cards || [] : [];
                const project = projectRes.status === 'fulfilled' ? projectRes.value.data : null;

                const taskEvents = cards
                    .filter((card) => card.dueDate)
                    .map((card) => {
                        const startDate = toDateAt(card.dueDate, 9);
                        if (!startDate) return null;
                        const endDate = new Date(startDate);
                        endDate.setHours(10, 0, 0, 0);

                        return {
                            id: `task-${card._id}`,
                            title: card.title,
                            start: startDate,
                            end: endDate,
                            allDay: false,
                            type: 'task',
                            resource: card,
                        };
                    })
                    .filter(Boolean);

                const projectEvents = [];
                if (project?.dueDate) {
                    const startDate = toDateAt(project.dueDate, 11);
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
                            resource: project,
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
                            resource: project,
                        });
                    }
                }

                setEvents([...taskEvents, ...projectEvents]);
            } catch (err) {
                console.error('Failed to load project calendar', err);
            }
        };
        fetchCalendarData();
    }, [projectId]);

    const eventStyleGetter = (event) => {
        const color = EVENT_COLORS[event.type]?.bg || EVENT_COLORS.task.bg;
        return {
            style: {
                backgroundColor: color,
                borderRadius: '6px',
                opacity: 0.9,
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
