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
        <div className="min-h-screen bg-white flex">
            {/* Sidebar */}
            <aside className="w-60 border-r bg-white flex flex-col">
                <div className="h-16 flex items-center px-5 border-b">
                    <div className="flex items-center gap-2 text-indigo-600 font-bold text-lg">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                            <Grid size={18} />
                        </div>
                        TaskHub
                    </div>
                </div>

                <nav className="flex-1 px-3 py-4 space-y-1 text-sm text-gray-700">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg transition hover:bg-gray-100"
                    >
                        <Home size={16} />
                        Dashboard
                    </button>
                    <button
                        onClick={() => navigate('/workspaces')}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg transition hover:bg-gray-100"
                    >
                        <Grid size={16} />
                        Workspaces
                    </button>
                    <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg transition hover:bg-gray-100">
                        <ListChecks size={16} />
                        My Tasks
                    </button>
                    <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg transition hover:bg-gray-100">
                        <Users size={16} />
                        Members
                    </button>
                    <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg transition hover:bg-gray-100">
                        <Grid size={16} />
                        Achieved
                    </button>
                    <button
                        onClick={() => navigate('/settings')}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg transition hover:bg-gray-100"
                    >
                        <Settings size={16} />
                        Settings
                    </button>
                </nav>

                <div className="border-t px-5 py-4 text-sm text-gray-500 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center font-semibold text-gray-700">
                            {userInfo?.fullname?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <div>
                            <div className="text-gray-800 font-medium text-sm">{userInfo?.fullname || 'User'}</div>
                            <div className="text-xs text-gray-500">{userInfo?.email || ''}</div>
                        </div>
                    </div>
                    <button onClick={handleLogout} className="text-gray-400 hover:text-red-500" title="Logout">
                        <LogOut size={18} />
                    </button>
                </div>
            </aside>

            {/* Main content */}
            <div className="flex-1 flex flex-col">
                {/* Top bar */}
                <header className="h-16 border-b flex items-center justify-between px-6 bg-white">
                    <div className="flex items-center gap-3">
                        <div className="text-xs text-gray-500">Workspaces</div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 border rounded-lg px-3 py-2 text-sm text-gray-700 min-w-50">
                            <span className="text-gray-500">Select Workspace</span>
                            <select
                                className="flex-1 bg-transparent outline-none text-gray-800"
                                value={selectedWorkspace?.workspace?._id || ''}
                                onChange={(e) => handleWorkspaceChange(e.target.value)}
                            >
                                <option value="" disabled>
                                    {selectedWorkspace?.workspace?.name || 'Select Workspace'}
                                </option>
                                {workspaces.map((ws) => (
                                    <option key={ws._id} value={ws._id}>
                                        {ws.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <button
                            onClick={() => setShowWorkspaceModal(true)}
                            className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-blue-700 transition"
                        >
                            <Plus size={16} />
                            New Workspace
                        </button>

                        <NotificationMenu />
                        
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center font-semibold text-gray-700">
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
