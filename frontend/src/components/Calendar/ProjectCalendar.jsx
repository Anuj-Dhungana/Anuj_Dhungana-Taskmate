import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import '../../styles/calendar.css';
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
  task: { bg: '#3B82F6', light: '#EFF6FF', text: '#1E40AF', dot: '#3B82F6' },
  deadline: { bg: '#EF4444', light: '#FEF2F2', text: '#991B1B', dot: '#EF4444' },
  meeting: { bg: '#8B5CF6', light: '#F5F3FF', text: '#5B21B6', dot: '#8B5CF6' },
};

const toDateAt = (value, hours) => {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  d.setHours(hours, 0, 0, 0);
  return d;
};

const getInitials = (name) => {
  if (!name) return '';
  return name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();
};

const ProjectEvent = ({ event, view }) => {
  const colors = EVENT_COLORS[event.type] || EVENT_COLORS.task;
  const assignees = event.resource?.assignees || [];
  const timeLabel = format(event.start, 'h:mm a');
  const showMeta = event.type === 'task' && assignees.length > 0;

  return (
    <div
      className="flex flex-col gap-1 px-2 py-1 rounded-md text-[11px] font-medium truncate"
      style={{ backgroundColor: colors.light, color: colors.text }}
      title={event.title}
    >
      <div className="flex items-center gap-1 min-w-0">
        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: colors.dot }} />
        <span className="truncate">{event.title}</span>
      </div>
      {(view !== 'month' || event.type === 'task') && (
        <div className="flex items-center justify-between text-[10px] text-gray-500">
          <span className="truncate">{timeLabel}</span>
          {showMeta && (
            <div className="flex items-center -space-x-1">
              {assignees.slice(0, 2).map((u) => (
                <div
                  key={u._id || u}
                  className="w-4 h-4 rounded-full bg-blue-500 text-[8px] text-white flex items-center justify-center border border-white overflow-hidden"
                  title={u.fullname}
                >
                  {u.avatar ? (
                    <img src={u.avatar} alt={u.fullname} className="w-full h-full object-cover" />
                  ) : (
                    getInitials(u.fullname)
                  )}
                </div>
              ))}
              {assignees.length > 2 && (
                <div className="w-4 h-4 rounded-full bg-gray-200 text-[8px] text-gray-600 flex items-center justify-center border border-white">
                  +{assignees.length - 2}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
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
                            resource: project,
                        });
                    }
                }
                if (false && project?.startDate) {
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

    const eventStyleGetter = () => ({
        style: {
            backgroundColor: 'transparent',
            border: 'none',
            padding: 0,
            margin: 0,
        }
    });

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
                    components={{
                        event: (props) => <ProjectEvent {...props} view={view} />,
                    }}
                    
                    min={new Date(0, 0, 0, 8, 0, 0)} 
                    max={new Date(0, 0, 0, 20, 0, 0)}
                />
            </div>
        </div>
    );
};

export default ProjectCalendar;
