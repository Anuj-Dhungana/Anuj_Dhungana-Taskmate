import { NavLink } from 'react-router-dom';

const NavigationItem = ({ item, isCollapsed, iconSize }) => {
    const hasBadge = Number(item.badgeCount) > 0;
    const badgeLabel = item.badgeCount > 99 ? '99+' : item.badgeCount;
    const displayLabel = item.locked ? `${item.label} 🔒` : item.label;
    const handleClick = (event) => {
        if (item.locked) {
            event.preventDefault();
            item.onLockedClick?.();
            return;
        }
        item.onClick?.(event);
    };

    return (
        <NavLink
            to={item.to}
            onClick={handleClick}
            className={({ isActive }) =>
                isCollapsed
                    ? `group relative flex items-center justify-center w-11 h-11 mx-auto rounded-xl transition ${
                        isActive
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                            : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                    }`
                    : `group relative w-full flex items-center gap-3 px-3 py-1.5 rounded-lg transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                        isActive
                            ? 'bg-blue-600/90 text-white font-semibold shadow-sm'
                            : 'hover:bg-gray-800/60 text-gray-300'
                    }`
            }
        >
            {() => (
                <>
                    <item.icon size={iconSize} />
                    {!isCollapsed && <span className="text-base">{displayLabel}</span>}
                    {!isCollapsed && hasBadge && (
                        <span className="ml-auto min-w-5 h-5 px-1 rounded-full bg-red-500 text-white text-[10px] font-semibold flex items-center justify-center">
                            {badgeLabel}
                        </span>
                    )}
                    {isCollapsed && hasBadge && (
                        <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-red-500 text-white text-[10px] font-semibold flex items-center justify-center border border-gray-900">
                            {badgeLabel}
                        </span>
                    )}
                    {isCollapsed && (
                        <span className="absolute left-full top-1/2 -translate-y-1/2 ml-3 hidden group-hover:block z-50">
                            <span className="bg-gray-900 text-white text-xs px-3 py-2 rounded-lg shadow-xl border border-gray-800 whitespace-nowrap">
                                {displayLabel}
                            </span>
                        </span>
                    )}
                </>
            )}
        </NavLink>
    );
};

export default NavigationItem;
