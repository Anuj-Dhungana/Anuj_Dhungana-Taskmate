import { Outlet, useNavigate, NavLink } from 'react-router-dom';
import axios from 'axios';
import {
    Grid,
    ListChecks,
    LogOut,
    Plus,
    Settings,
    Users,
    Calendar,
    BarChart3,
    MessageSquare,
    Phone,
    Search,
    Video,
    ChevronDown
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import useAuthStore from '../store/useAuthStore';
import useWorkspaceStore from '../store/userWorkspaceStore';
import CreateWorkspaceModal from '../components/CreateWorkspaceModal';
import NotificationMenu from '../components/NotificationMenu';
import CreateProjectModal from '../components/CreateProjectModal';

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
    const [showProjectModal, setShowProjectModal] = useState(false);
    const [workspaceMenuOpen, setWorkspaceMenuOpen] = useState(false);

    const handleLogout = async () => {
        await axios.post('/api/auth/logout');
        logout();
        resetWorkspaceState();
        navigate('/login');
    };

    const fetchWorkspaces = async () => {
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
    };

    const fetchWorkspaceDetails = async (workspaceId) => {
        if (!workspaceId) return;
        try {
            const res = await axios.get(`/api/workspaces/${workspaceId}`);
            setSelectedWorkspace(res.data);
        } catch (err) {
            console.error('Failed to load workspace details', err);
        }
    };

    useEffect(() => {
        if (userInfo?._id) {
            fetchWorkspaces();
        }
    }, [userInfo?._id]);

    useEffect(() => {
        if (currentWorkspaceId) {
            fetchWorkspaceDetails(currentWorkspaceId);
        }
    }, [currentWorkspaceId]);

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

    const navItems = [
        { to: '/dashboard', label: 'Dashboard / Analytics', icon: BarChart3 },
        { to: '/projects', label: 'Projects', icon: Grid },
        { to: '/tasks', label: 'My Tasks', icon: ListChecks },
        { to: '/calendar', label: 'Calendar', icon: Calendar },
        { to: '/chat', label: 'Chat', icon: MessageSquare },
        { to: '/calls', label: 'Calls', icon: Phone },
        { to: '/members', label: 'Members', icon: Users },
        { to: '/settings', label: 'Settings', icon: Settings },
    ];

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Dark Sidebar */}
            <aside className="w-60 bg-gradient-to-b from-gray-900 to-gray-800 text-white flex flex-col shadow-xl">
                <div className="h-16 flex items-center px-5 border-b border-gray-700/50">
                    <div className="flex items-center gap-2 font-bold text-lg">
                        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                            <Grid size={18} />
                        </div>
                        TaskMate
                    </div>
                </div>

                <div className="px-3 pt-4">
                    {/* Workspace Selector */}
                    <div className="relative">
                        <button
                            onClick={() => setWorkspaceMenuOpen((v) => !v)}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-gray-800/70 hover:bg-gray-700/70 transition text-left"
                        >
                            <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: currentWorkspace?.color || '#F97316' }}
                            ></div>
                            <div className="flex-1 min-w-0">
                                <div className="text-sm font-semibold text-white truncate">
                                    {currentWorkspace?.name || 'Select Workspace'}
                                </div>
                                <div className="text-[11px] text-gray-400">Workspace</div>
                            </div>
                            <ChevronDown size={14} className="text-gray-400" />
                        </button>

                        {workspaceMenuOpen && (
                            <div className="absolute z-50 mt-2 w-full bg-gray-900 border border-gray-700 rounded-lg shadow-xl overflow-hidden">
                                <div className="max-h-64 overflow-y-auto">
                                    {workspaces.map((ws) => (
                                        <button
                                            key={ws._id}
                                            onClick={() => handleWorkspaceSelect(ws._id)}
                                            className={`w-full flex items-center gap-3 px-3 py-2 text-sm text-left hover:bg-gray-800 transition ${
                                                ws._id === currentWorkspaceId ? 'bg-gray-800 text-white' : 'text-gray-300'
                                            }`}
                                        >
                                            <span
                                                className="w-2.5 h-2.5 rounded-full"
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
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-blue-400 hover:text-blue-300 hover:bg-gray-800 transition border-t border-gray-800"
                                >
                                    <Plus size={14} />
                                    Create Workspace
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <nav className="flex-1 px-3 py-4 space-y-1 text-sm">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            className={({ isActive }) =>
                                `w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition ${
                                    isActive
                                        ? 'bg-blue-600 text-white font-medium'
                                        : 'hover:bg-gray-700/50 text-gray-300'
                                }`
                            }
                        >
                            <item.icon size={18} />
                            {item.label}
                        </NavLink>
                    ))}
                </nav>

                <div className="border-t border-gray-700/50 p-4 text-xs text-gray-400">
                    Workspace-scoped navigation
                </div>
            </aside>

            {/* Main content */}
            <div className="flex-1 flex flex-col">
                {/* Top bar */}
                <header className="h-16 bg-white flex items-center justify-between px-8 shadow-sm">
                    <div className="flex items-center gap-4 flex-1 max-w-2xl">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search tasks, projects..."
                                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate('/calls')}
                            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
                        >
                            <Video size={16} />
                            Start Call
                        </button>
                        
                        {currentWorkspaceId && (
                            <button
                                onClick={() => setShowProjectModal(true)}
                                className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition"
                            >
                                <Plus size={16} />
                                New Project
                            </button>
                        )}

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

                {showProjectModal && currentWorkspaceId && (
                    <CreateProjectModal
                        isOpen={showProjectModal}
                        onClose={() => setShowProjectModal(false)}
                        workspaceId={currentWorkspaceId}
                        onCreated={() => {
                            fetchWorkspaceDetails(currentWorkspaceId);
                            setShowProjectModal(false);
                        }}
                        members={selectedWorkspace?.workspace?.members || []}
                    />
                )}
            </div>
        </div>
    );
};

export default DashboardLayout;
