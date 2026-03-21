import { EVENT_COLORS } from '../../utils/calendarHelpers';

const TypeBadge = ({ type }) => {
    const colors = EVENT_COLORS[type] || EVENT_COLORS.deadline;
    return (
        <span
            className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full capitalize"
            style={{ backgroundColor: colors.light, color: colors.text, border: `1px solid ${colors.border}` }}
        >
            {type}
        </span>
    );
};

export default TypeBadge;
