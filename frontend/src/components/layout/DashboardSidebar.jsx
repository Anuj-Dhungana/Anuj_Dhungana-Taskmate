import { Grid, ChevronsLeft, ChevronsRight } from 'lucide-react';
import WorkspaceSelector from './WorkspaceSelector';
import NavigationGroup from './NavigationGroup';
import { NAV_GROUPS, SYSTEM_ITEMS } from '../../utils/navigationConfig';

const DashboardSidebar = ({
    isCollapsed,
    onToggleCollapse,
    workspaceProps,
}) => {
    const iconSize = 20;

    return (
        <aside
            className={`${
                isCollapsed ? 'w-[72px]' : 'w-[248px]'
            } bg-gradient-to-b from-gray-950 to-gray-900 text-white flex flex-col shadow-xl transition-all duration-200 ease-out overflow-hidden shrink-0`}
        >
            {/* Header */}
            <div className="h-16 flex items-center justify-between px-4 border-b border-gray-800/70">
                <div className="flex items-center gap-2 font-bold text-lg">
                    <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center shadow-md">
                        <Grid size={20} />
                    </div>
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
        </aside>
    );
};

export default DashboardSidebar;
