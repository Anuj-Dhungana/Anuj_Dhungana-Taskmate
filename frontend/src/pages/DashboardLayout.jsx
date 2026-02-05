import { Outlet, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    Grid,
    Home,
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
    Video
} from 'lucide-react';
import { useState } from 'react';
import useAuthStore from '../store/useAuthStore';
import useWorkspaceStore from '../store/userWorkspaceStore';
import CreateWorkspaceModal from '../components/CreateWorkspaceModal';
import NotificationMenu from '../components/NotificationMenu';

const DashboardLayout = () => {
    const navigate = useNavigate();
    const { userInfo, logout } = useAuthStore();
    const { workspaces, selectedWorkspace, setSelectedWorkspace } = useWorkspaceStore();
    const [showWorkspaceModal, setShowWorkspaceModal] = useState(false);

    const handleLogout = async () => {
        await axios.post('/api/auth/logout');
        logout();
        navigate('/login');
    };

    const handleWorkspaceChange = async (workspaceId) => {
        if (!workspaceId) return;
        
        try {
            const res = await axios.get(`/api/workspaces/${workspaceId}`);
            setSelectedWorkspace(res.data);
            navigate(`/workspaces/${workspaceId}`);
        } catch (err) {
            console.error('Failed to load workspace', err);
        }
    };

    const handleWorkspaceCreated = () => {
        navigate('/workspaces');
    };

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

                <nav className="flex-1 px-3 py-4 space-y-1 text-sm">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition bg-blue-600 text-white font-medium"
                    >
                        <Home size={18} />
                        Dashboard
                    </button>
                    <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition hover:bg-gray-700/50 text-gray-300">
                        <ListChecks size={18} />
                        My Tasks
                    </button>
                    <button
                        onClick={() => navigate('/workspaces')}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition hover:bg-gray-700/50 text-gray-300"
                    >
                        <Grid size={18} />
                        Projects
                    </button>
                    <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition hover:bg-gray-700/50 text-gray-300">
                        <Users size={18} />
                        Members
                    </button>
                    <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition hover:bg-gray-700/50 text-gray-300">
                        <Calendar size={18} />
                        Calendar
                    </button>
                    <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition hover:bg-gray-700/50 text-gray-300">
                        <BarChart3 size={18} />
                        Analytics
                    </button>
                    <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition hover:bg-gray-700/50 text-gray-300">
                        <MessageSquare size={18} />
                        Chat
                    </button>
                    <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition hover:bg-gray-700/50 text-gray-300">
                        <Phone size={18} />
                        Calls
                    </button>

                    {/* Workspaces Section */}
                    <div className="pt-6">
                        <div className="flex items-center justify-between px-3 mb-2">
                            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Workspaces</div>
                            <button className="text-gray-400 hover:text-white">
                                <Plus size={16} />
                            </button>
                        </div>
                        <div className="space-y-1">
                            <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg transition hover:bg-gray-700/50 text-gray-300 text-sm">
                                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                Marketing Team
                            </button>
                            <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg transition hover:bg-gray-700/50 text-gray-300 text-sm">
                                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                Product Dev
                            </button>
                            <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg transition hover:bg-gray-700/50 text-gray-300 text-sm">
                                <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                                Design Sprint
                            </button>
                        </div>
                    </div>
                </nav>

                <div className="border-t border-gray-700/50 p-4">
                    <button
                        onClick={() => navigate('/settings')}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition hover:bg-gray-700/50 text-gray-300 text-sm mb-3"
                    >
                        <Settings size={18} />
                        Settings
                    </button>
                    <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-gray-700/30">
                        <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center font-semibold text-sm">
                            {userInfo?.fullname?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-white truncate">{userInfo?.fullname || 'User'}</div>
                            <div className="text-xs text-gray-400 truncate">{userInfo?.email || ''}</div>
                        </div>
                        <button onClick={handleLogout} className="text-gray-400 hover:text-red-400" title="Logout">
                            <LogOut size={16} />
                        </button>
                    </div>
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
                        <button className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition">
                            <Video size={16} />
                            Start Call
                        </button>
                        
                        <button
                            onClick={() => setShowWorkspaceModal(true)}
                            className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition"
                        >
                            <Plus size={16} />
                            New Task
                        </button>

                        <NotificationMenu />
                        
                        <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center font-semibold text-white text-sm cursor-pointer">
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
