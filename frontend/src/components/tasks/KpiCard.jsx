/**
 * KpiCard — a clickable stat card for the My Tasks summary row.
 *
 * Props:
 *   label          {string}    display label
 *   icon           {ReactNode} lucide icon element
 *   count          {number}    the numeric value to display
 *   isActive       {boolean}   whether this card is the active filter
 *   onClick        {function}  click handler
 *   activeClassName  {string}  tailwind classes applied when active
 *   defaultClassName {string}  tailwind classes applied when inactive
 */
const KpiCard = ({ label, icon, count, isActive, onClick, activeClassName, defaultClassName }) => (
    <button
        type="button"
        onClick={onClick}
        className={`rounded-xl border p-4 text-left transition ${isActive ? activeClassName : defaultClassName}`}
    >
        <div className="flex items-center gap-2 text-sm">
            {icon}
            <span>{label}</span>
        </div>
        <div className="text-3xl font-bold mt-2">{count}</div>
    </button>
);

export default KpiCard;
