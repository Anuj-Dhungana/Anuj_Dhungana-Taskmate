import { EVENT_COLORS } from '../../utils/calendarHelpers';

const CalendarLegend = () => {
    return (
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2.5">Legend</p>
            <div className="grid grid-cols-2 gap-2">
                {Object.entries(EVENT_COLORS).map(([type, colors]) => (
                    <div key={type} className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: colors.bg }} />
                        <span className="text-xs text-gray-600 capitalize">{type}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default CalendarLegend;
