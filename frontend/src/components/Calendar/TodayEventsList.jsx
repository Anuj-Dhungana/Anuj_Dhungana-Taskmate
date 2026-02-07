import { format } from 'date-fns';
import { CalendarDays, Clock, Flag } from 'lucide-react';
import { EVENT_COLORS, formatEventDuration } from '../../utils/calendarHelpers';

const TodayEventsList = ({ events, onEventClick }) => {
    return (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
                <CalendarDays size={16} className="text-indigo-500" />
                <h3 className="text-sm font-bold text-gray-900">Today's Events</h3>
            </div>
            {events.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-4">No events today</p>
            ) : (
                <div className="space-y-2.5">
                    {events.map(event => {
                        const colors = EVENT_COLORS[event.type] || EVENT_COLORS.deadline;
                        return (
                            <div
                                key={event.id}
                                onClick={() => onEventClick(event)}
                                className="p-3 rounded-xl cursor-pointer hover:shadow-sm transition-all"
                                style={{ backgroundColor: colors.light, borderLeft: `3px solid ${colors.bg}` }}
                            >
                                <p className="text-sm font-semibold text-gray-800">{event.title}</p>
                                <div className="flex items-center gap-3 mt-1.5">
                                    <span className="flex items-center gap-1 text-[11px] text-gray-500">
                                        <Clock size={11} />
                                        {format(event.start, 'h:mm a')} · {formatEventDuration(event.start, event.end)}
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
    );
};

export default TodayEventsList;
