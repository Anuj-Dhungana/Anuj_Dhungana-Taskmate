import { NavLink } from 'react-router-dom';

const NavigationItem = ({ item, isCollapsed, iconSize }) => {
    return (
        <NavLink
            to={item.to}
            className={({ isActive }) =>
                isCollapsed
                    ? `group relative flex items-center justify-center w-10 h-10 mx-auto rounded-xl transition ${
                        isActive
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                            : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                    }`
                    : `group relative w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                        isActive
                            ? 'bg-blue-600/90 text-white font-semibold shadow-sm'
                            : 'hover:bg-gray-800/60 text-gray-300'
                    }`
            }
        >
            {() => (
                <>
                    <item.icon size={iconSize} />
                    {!isCollapsed && <span>{item.label}</span>}
                    {isCollapsed && (
                        <span className="absolute left-full top-1/2 -translate-y-1/2 ml-3 hidden group-hover:block z-50">
                            <span className="bg-gray-900 text-white text-xs px-3 py-2 rounded-lg shadow-xl border border-gray-800 whitespace-nowrap">
                                {item.label}
                            </span>
                        </span>
                    )}
                </>
            )}
        </NavLink>
    );
};

export default NavigationItem;
