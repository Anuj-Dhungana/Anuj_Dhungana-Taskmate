import { ChevronsLeft, ChevronsRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import WorkspaceSelector from './WorkspaceSelector';
import NavigationGroup from './NavigationGroup';
import { NAV_GROUPS, SYSTEM_ITEMS } from '../../utils/navigationConfig';
import logo from '../../assets/logo.png';

const DashboardSidebar = ({
    isCollapsed,
    onToggleCollapse,
    workspaceProps,
    userInfo,
    onLogout,
}) => {
    const navigate = useNavigate();
    const iconSize = 20;

    const avatarSrc = userInfo?.avatar;
    const avatarInitial = userInfo?.fullname?.[0]?.toUpperCase() || 'U';

    return (
        <aside
            className={`${
                isCollapsed ? 'w-18' : 'w-62'
            } bg-linear-to-b from-gray-950 to-gray-900 text-white flex flex-col shadow-xl transition-all duration-200 ease-out overflow-hidden shrink-0`}
        >
            {/* Header */}
            <div className="h-16 flex items-center justify-between px-4 border-b border-gray-800/70">
                <div className="flex items-center gap-2 font-bold text-lg">
                    <img src={logo} alt="TaskMate" className="w-9 h-9 rounded-lg object-contain" />
                    <span
                        className={`transition-all duration-200 ease-out ${
                            isCollapsed ? 'opacity-0 -translate-x-2 pointer-events-none w-0' : 'opacity-100 translate-x-0'
                        }`}
                    >
                        TaskMate
                    </span>
                </div>
                <button
                    onClick={onToggleCollapse}
                    className="w-9 h-9 rounded-md flex items-center justify-center text-gray-300 hover:text-white hover:bg-gray-800/70 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                    aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                    title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                >
                    {isCollapsed ? <ChevronsRight size={18} /> : <ChevronsLeft size={18} />}
                </button>
            </div>

            {/* Workspace Selector */}
            <WorkspaceSelector {...workspaceProps} isCollapsed={isCollapsed} />

            {/* Navigation Groups */}
            <nav className={`flex-1 py-4 text-sm ${isCollapsed ? 'px-2 space-y-2' : 'px-3 space-y-4'} overflow-hidden`}>
                {NAV_GROUPS.map((group, index) => (
                    <NavigationGroup
                        key={group.label}
                        group={group}
                        isCollapsed={isCollapsed}
                        iconSize={iconSize}
                        showDivider={index > 0}
                    />
                ))}
            </nav>

            {/* System Items */}
            <div className={`border-t border-gray-800/60 py-3 text-sm ${isCollapsed ? 'px-2 space-y-1' : 'px-3 space-y-1'}`}>
                {!isCollapsed && (
                    <div className="px-3 text-[11px] uppercase tracking-wider text-gray-500">
                        System
                    </div>
                )}
                <NavigationGroup
                    group={{ items: SYSTEM_ITEMS }}
                    isCollapsed={isCollapsed}
                    iconSize={iconSize}
                />
            </div>

            {/* User Profile Section */}
            <div className="border-t border-gray-800/60 p-3">
                {isCollapsed ? (
                    <button
                        onClick={() => navigate('/profile')}
                        className="w-full flex items-center justify-center p-2 rounded-lg hover:bg-gray-800/70 transition-colors group"
                        title={userInfo?.fullname || 'Profile'}
                    >
                        {avatarSrc ? (
                            <img
                                src={avatarSrc}
                                alt="Profile"
                                className="w-9 h-9 rounded-full object-cover border-2 border-gray-700 group-hover:border-blue-500 transition-colors"
                            />
                        ) : (
                            <div className="w-9 h-9 rounded-full bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold border-2 border-gray-700 group-hover:border-blue-500 transition-colors">
                                {avatarInitial}
                            </div>
                        )}
                    </button>
                ) : (
                    <button
                        onClick={() => navigate('/profile')}
                        className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-gray-800/70 transition-colors group"
                    >
                        {avatarSrc ? (
                            <img
                                src={avatarSrc}
                                alt="Profile"
                                className="w-10 h-10 rounded-full object-cover border-2 border-gray-700 group-hover:border-blue-500 transition-colors shrink-0"
                            />
                        ) : (
                            <div className="w-10 h-10 rounded-full bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-base font-bold border-2 border-gray-700 group-hover:border-blue-500 transition-colors shrink-0">
                                {avatarInitial}
                            </div>
                        )}
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-white truncate">{userInfo?.fullname || 'User'}</p>
                            <p className="text-xs text-gray-400 truncate">{userInfo?.email || ''}</p>
                        </div>
                    </button>
                )}
            </div>
        </aside>
    );
};

export default DashboardSidebar;
