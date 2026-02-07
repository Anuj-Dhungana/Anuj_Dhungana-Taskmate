import { Outlet, useNavigate, NavLink } from 'react-router-dom';
import axios from 'axios';
import {
    Grid,
    TrendingUp,
    ListChecks,
    LogOut,
    Plus,
    Settings,
    Users,
    Calendar,
    BarChart3,
    MessageSquare,
    Phone,
    ChevronDown,
    ChevronsLeft,
    ChevronsRight
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import useAuthStore from '../store/useAuthStore';
import useWorkspaceStore from '../store/useWorkspaceStore';
import useRealtimeSyncStore from '../store/useRealtimeSyncStore';
import CreateWorkspaceModal from '../components/modals/CreateWorkspaceModal';
import NotificationMenu from '../components/notification/NotificationMenu';

const DashboardLayout = () => {
    const navigate = useNavigate();
    const { userInfo, logout } = useAuthStore();
    const { 
        workspaces, 
        selectedWorkspace, 
        currentWorkspaceId, 
        setWorkspaces, 
        setSelectedWorkspace, 
        setCurrentWorkspaceId,
        resetWorkspaceState
    } = useWorkspaceStore();
    const [showWorkspaceModal, setShowWorkspaceModal] = useState(false);
    const [workspaceMenuOpen, setWorkspaceMenuOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const { initialize: initRealtime, joinWorkspace } = useRealtimeSyncStore();

    const handleLogout = async () => {
        await axios.post('/api/auth/logout');
        logout();
        resetWorkspaceState();
        navigate('/login');
    };

    const fetchWorkspaces = useCallback(async () => {
        try {
            const res = await axios.get('/api/workspaces');
            setWorkspaces(res.data);

            // If no selection yet, default to first workspace
            if (!currentWorkspaceId && res.data.length > 0) {
                setCurrentWorkspaceId(res.data[0]._id);
            }

            // If stored workspace no longer exists, fallback
            if (currentWorkspaceId && !res.data.find((w) => w._id === currentWorkspaceId)) {
                setCurrentWorkspaceId(res.data[0]?._id || null);
            }
        } catch (err) {
            console.error('Failed to load workspaces', err);
        }
    }, [currentWorkspaceId, setCurrentWorkspaceId, setWorkspaces]);

    const fetchWorkspaceDetails = useCallback(async (workspaceId) => {
        if (!workspaceId) return;
        try {
            const res = await axios.get(`/api/workspaces/${workspaceId}`);
            setSelectedWorkspace(res.data);
        } catch (err) {
            console.error('Failed to load workspace details', err);
        }
    }, [setSelectedWorkspace]);

    useEffect(() => {
        if (userInfo?._id) {
            fetchWorkspaces();
        }
    }, [userInfo?._id, fetchWorkspaces]);

    useEffect(() => {
        if (!userInfo?._id) return;
        initRealtime();
    }, [userInfo?._id, initRealtime]);

    useEffect(() => {
        if (currentWorkspaceId) {
            fetchWorkspaceDetails(currentWorkspaceId);
            joinWorkspace(currentWorkspaceId);
        }
    }, [currentWorkspaceId, fetchWorkspaceDetails, joinWorkspace]);

    const handleWorkspaceSelect = (workspaceId) => {
        setCurrentWorkspaceId(workspaceId);
        setWorkspaceMenuOpen(false);
        navigate('/dashboard');
    };

    const handleWorkspaceCreated = async (workspace) => {
        await fetchWorkspaces();
        if (workspace?._id) {
            setCurrentWorkspaceId(workspace._id);
        }
        setShowWorkspaceModal(false);
    };

    const currentWorkspace = useMemo(
        () => workspaces.find((w) => w._id === currentWorkspaceId) || null,
        [workspaces, currentWorkspaceId]
    );

    const myRole = useMemo(() => {
        const members = selectedWorkspace?.workspace?.members || [];
        const me = members.find((m) => m.user?._id === userInfo?._id);
        return me?.role ? `${me.role[0].toUpperCase()}${me.role.slice(1)}` : 'Member';
    }, [selectedWorkspace, userInfo]);

    const navIconSize = isCollapsed ? 20 : 20;

    const navGroups = [
        {
            label: 'Workspace',
            items: [
                { to: '/dashboard', label: 'Dashboard', icon: BarChart3 },
                { to: '/projects', label: 'Projects', icon: Grid },
                { to: '/tasks', label: 'My Tasks', icon: ListChecks },
                { to: '/calendar', label: 'Calendar', icon: Calendar },
                { to: '/members', label: 'Members', icon: Users },
            ],
        },
        {
            label: 'Collaboration',
            items: [
                { to: '/chat', label: 'Chat', icon: MessageSquare },
                { to: '/calls', label: 'Calls', icon: Phone },
            ],
        },
        {
            label: 'Insights',
            items: [
                { to: '/analytics', label: 'Analytics', icon: TrendingUp },
            ],
        },
    ];

    const systemItems = [
        { to: '/settings', label: 'Settings', icon: Settings },
    ];

    return (
        <div className="h-screen overflow-hidden bg-gray-50 flex">
            {/* Dark Sidebar */}
            <aside
                className={`${
                    isCollapsed ? 'w-[72px]' : 'w-[248px]'
                } bg-gradient-to-b from-gray-950 to-gray-900 text-white flex flex-col shadow-xl transition-all duration-200 ease-out overflow-hidden shrink-0`}
            >
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
                        onClick={() => setIsCollapsed((v) => !v)}
                        className="w-9 h-9 rounded-md flex items-center justify-center text-gray-300 hover:text-white hover:bg-gray-800/70 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                        aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                        title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                    >
                        {isCollapsed ? <ChevronsRight size={18} /> : <ChevronsLeft size={18} />}
                    </button>
                </div>

                <div className={`pt-4 ${isCollapsed ? 'px-2' : 'px-3'}`}>
                    {/* Workspace Selector */}
                    <div className="relative group">
                        {isCollapsed ? (
                            <button
                                onClick={() => setWorkspaceMenuOpen((v) => !v)}
                                className="w-10 h-10 mx-auto flex items-center justify-center rounded-xl hover:ring-2 hover:ring-gray-700 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                                style={{ backgroundColor: currentWorkspace?.color || '#F97316' }}
                            >
                                <span className="text-white text-sm font-bold">
                                    {(currentWorkspace?.name || 'W').substring(0, 1).toUpperCase()}
                                </span>
                            </button>
                        ) : (
                            <button
                                onClick={() => setWorkspaceMenuOpen((v) => !v)}
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
                                            onClick={() => handleWorkspaceSelect(ws._id)}
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
                                    onClick={() => {
                                        setWorkspaceMenuOpen(false);
                                        setShowWorkspaceModal(true);
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-blue-400 hover:text-blue-300 hover:bg-gray-900 transition border-t border-gray-800"
                                >
                                    <Plus size={14} />
                                    Create Workspace
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <nav className={`flex-1 py-4 text-sm ${isCollapsed ? 'px-2 space-y-2' : 'px-3 space-y-4'} overflow-hidden`}>
                    {navGroups.map((group) => (
                        <div key={group.label} className={isCollapsed ? 'space-y-1' : 'space-y-1'}>
                            {!isCollapsed && (
                                <div className="px-3 text-[11px] uppercase tracking-wider text-gray-500">
                                    {group.label}
                                </div>
                            )}
                            {isCollapsed && group !== navGroups[0] && (
                                <div className="border-t border-gray-800/40 my-2"></div>
                            )}
                            {group.items.map((item) => (
                                <NavLink
                                    key={item.to}
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
                                            <item.icon size={navIconSize} />
                                            {!isCollapsed && (
                                                <span>{item.label}</span>
                                            )}
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
                            ))}
                        </div>
                    ))}
                </nav>

                <div className={`border-t border-gray-800/60 py-3 text-sm ${isCollapsed ? 'px-2 space-y-1' : 'px-3 space-y-1'}`}>
                    {!isCollapsed && (
                        <div className="px-3 text-[11px] uppercase tracking-wider text-gray-500">
                            System
                        </div>
                    )}
                    {systemItems.map((item) => (
                        <NavLink
                            key={item.to}
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
                                    <item.icon size={navIconSize} />
                                    {!isCollapsed && (
                                        <span>{item.label}</span>
                                    )}
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
                    ))}
                </div>
            </aside>

            {/* Main content */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Top bar */}
                <header className="h-16 bg-white flex items-center justify-end px-8 shadow-sm">
                    <div className="flex items-center gap-3">

                        <NotificationMenu />

                        <button
                            onClick={handleLogout}
                            className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:text-red-500 hover:border-red-200 transition"
                            title="Logout"
                        >
                            <LogOut size={16} />
                        </button>

                        <div
                            onClick={() => navigate('/profile')}
                            className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center font-semibold text-white text-sm cursor-pointer"
                            title="Profile"
                        >
                            {userInfo?.fullname?.[0]?.toUpperCase() || 'A'}
                        </div>
                    </div>
                </header>

                {/* Page content */}
                <main className="flex-1 overflow-y-auto bg-gray-50">
                    <Outlet />
                </main>

                {showWorkspaceModal && (
                    <CreateWorkspaceModal 
                        onClose={() => setShowWorkspaceModal(false)} 
                        onCreated={handleWorkspaceCreated} 
                    />
                )}

            </div>
        </div>
    );
};

export default DashboardLayout;
