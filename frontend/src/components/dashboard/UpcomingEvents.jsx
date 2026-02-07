import { useNavigate } from 'react-router-dom';
import { Calendar, FolderKanban, CheckSquare, ArrowRight } from 'lucide-react';
import { formatShortDate } from '../../utils/dashboardHelpers';

const EventItem = ({ item }) => {
    const isProject = item.type === 'project';
    return (
        <div className="flex items-center gap-2.5 py-1.5">
            <div
                className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${
                    isProject ? 'bg-indigo-50 text-indigo-500' : 'bg-blue-50 text-blue-500'
                }`}
            >
                {isProject ? <FolderKanban size={12} /> : <CheckSquare size={12} />}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-700 truncate">{item.title}</p>
                {item.projectName && (
                    <p className="text-[10px] text-gray-400 truncate">{item.projectName}</p>
                )}
            </div>
            <span className="text-[10px] text-gray-400 shrink-0">{formatShortDate(item.date)}</span>
        </div>
    );
};

const DayGroup = ({ label, items, accentColor }) => {
    if (items.length === 0) return null;
    return (
        <div className="mb-3">
            <p className={`text-[10px] font-bold uppercase tracking-wide mb-1.5 ${accentColor}`}>{label}</p>
            <div className="space-y-0.5">
                {items.map((item) => (
                    <EventItem key={`${item.type}-${item.id}`} item={item} />
                ))}
            </div>
        </div>
    );
};

const UpcomingEvents = ({ grouped }) => {
    const navigate = useNavigate();
    const hasEvents = grouped.today.length > 0 || grouped.tomorrow.length > 0 || grouped.later.length > 0;

    return (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold text-gray-900">Upcoming</h2>
                <Calendar size={14} className="text-gray-400" />
            </div>

            {!hasEvents ? (
                <div className="text-center py-6">
                    <p className="text-xs text-gray-500 mb-1">No upcoming events this week</p>
                    <button
                        onClick={() => navigate('/calendar')}
                        className="text-xs text-indigo-600 font-semibold hover:text-indigo-700"
                    >
                        Open Calendar
                    </button>
                </div>
            ) : (
                <>
                    <DayGroup label="Today" items={grouped.today} accentColor="text-indigo-600" />
                    <DayGroup label="Tomorrow" items={grouped.tomorrow} accentColor="text-blue-600" />
                    <DayGroup label="Later this week" items={grouped.later} accentColor="text-gray-500" />

                    <button
                        onClick={() => navigate('/calendar')}
                        className="w-full mt-3 py-2 text-xs text-indigo-600 font-semibold flex items-center justify-center gap-1 hover:bg-indigo-50 rounded-lg transition"
                    >
                        Open Calendar <ArrowRight size={12} />
                    </button>
                </>
            )}
        </div>
    );
};

export default UpcomingEvents;
