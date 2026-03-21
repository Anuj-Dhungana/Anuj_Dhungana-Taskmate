import { EVENT_COLORS } from '../../utils/calendarHelpers';

const CustomEvent = ({ event }) => {
    const colors = EVENT_COLORS[event.type] || EVENT_COLORS.deadline;
    const tooltip = event.meta?.projectName ? `${event.title} (${event.meta.projectName})` : event.title;
    
    return (
        <div
            className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-medium truncate cursor-pointer"
            style={{ backgroundColor: colors.light, color: colors.text }}
            title={tooltip}
        >
            <span
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ backgroundColor: colors.dot }}
            />
            <span className="truncate">{event.title}</span>
        </div>
    );
};

export default CustomEvent;
