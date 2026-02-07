import { Plus, ChevronDown } from 'lucide-react';

const WorkspaceSelector = ({
    currentWorkspace,
    workspaces,
    currentWorkspaceId,
    myRole,
    isCollapsed,
    workspaceMenuOpen,
    onToggleMenu,
    onSelectWorkspace,
    onCreateWorkspace,
}) => {
    return (
        <div className={`pt-4 ${isCollapsed ? 'px-2' : 'px-3'}`}>
            <div className="relative group">
                {isCollapsed ? (
                    <button
                        onClick={onToggleMenu}
                        className="w-10 h-10 mx-auto flex items-center justify-center rounded-xl hover:ring-2 hover:ring-gray-700 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                        style={{ backgroundColor: currentWorkspace?.color || '#F97316' }}
                    >
                        <span className="text-white text-sm font-bold">
                            {(currentWorkspace?.name || 'W').substring(0, 1).toUpperCase()}
                        </span>
                    </button>
                ) : (
                    <button
                        onClick={onToggleMenu}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-gray-900/70 hover:bg-gray-800/80 transition text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                    >
                        <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                            style={{ backgroundColor: currentWorkspace?.color || '#F97316' }}
                        >
                            {(currentWorkspace?.name || 'W').substring(0, 1).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold text-white truncate">
                                {currentWorkspace?.name || 'Select Workspace'}
                            </div>
                            <div className="text-[11px] text-gray-400">{myRole}</div>
                        </div>
                        <ChevronDown size={14} className="text-gray-400" />
                    </button>
                )}

                {isCollapsed && (
                    <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 hidden group-hover:block z-50">
                        <div className="bg-gray-900 text-white text-xs px-3 py-2 rounded-lg shadow-xl border border-gray-800 whitespace-nowrap">
                            <div className="font-semibold">{currentWorkspace?.name || 'Select Workspace'}</div>
                            <div className="text-[11px] text-gray-300">{myRole}</div>
                        </div>
                    </div>
                )}

                {workspaceMenuOpen && (
                    <div
                        className={`absolute z-50 mt-2 ${
                            isCollapsed ? 'left-full ml-2 top-0 w-64' : 'w-full'
                        } bg-gray-950 border border-gray-800 rounded-lg shadow-xl overflow-hidden`}
                    >
                        <div className="max-h-64 overflow-y-auto">
                            {workspaces.map((ws) => (
                                <button
                                    key={ws._id}
                                    onClick={() => onSelectWorkspace(ws._id)}
                                    className={`w-full flex items-center gap-3 px-3 py-2 text-sm text-left hover:bg-gray-900 transition ${
                                        ws._id === currentWorkspaceId ? 'bg-gray-800 text-white' : 'text-gray-300'
                                    }`}
                                >
                                    <span
                                        className="w-2.5 h-2.5 rounded-full shrink-0"
                                        style={{ backgroundColor: ws.color || '#F97316' }}
                                    ></span>
                                    <span className="truncate">{ws.name}</span>
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={onCreateWorkspace}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-blue-400 hover:text-blue-300 hover:bg-gray-900 transition border-t border-gray-800"
                        >
                            <Plus size={14} />
                            Create Workspace
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default WorkspaceSelector;
