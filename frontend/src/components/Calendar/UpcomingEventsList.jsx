import { format } from 'date-fns';
import { Clock, Calendar as CalendarIcon, Flag } from 'lucide-react';
import { EVENT_COLORS } from '../../utils/calendarHelpers';
import TypeBadge from './TypeBadge';

const UpcomingEventsList = ({ events, onEventClick }) => {
    return (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
                <Clock size={16} className="text-purple-500" />
                <h3 className="text-sm font-bold text-gray-900">Upcoming Events</h3>
            </div>
            {events.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-4">No upcoming events</p>
            ) : (
                <div className="space-y-2.5 max-h-[35vh] overflow-y-auto pr-1">
                    {events.map(event => {
                        const colors = EVENT_COLORS[event.type] || EVENT_COLORS.deadline;
                        return (
                            <div
                                key={event.id}
                                onClick={() => onEventClick(event)}
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
    );
};

export default UpcomingEventsList;
