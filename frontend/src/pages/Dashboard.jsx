import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
    TrendingUp, 
    CheckCircle2, 
    Clock, 
    Users, 
    FolderKanban,
    ArrowRight,
    Calendar,
    AlertCircle
} from 'lucide-react';
import useAuthStore from '../store/useAuthStore';
import useWorkspaceStore from '../store/userWorkspaceStore';

const Dashboard = () => {
    const navigate = useNavigate();
    const { userInfo } = useAuthStore();
    const { workspaces, setWorkspaces } = useWorkspaceStore();
    const [stats, setStats] = useState({
        totalWorkspaces: 0,
        totalProjects: 0,
        activeTasks: 0,
        completedTasks: 0
    });
    const [recentWorkspaces, setRecentWorkspaces] = useState([]);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const res = await axios.get('/api/workspaces');
            setWorkspaces(res.data);
            
            // Calculate stats
            const totalProjects = res.data.reduce((acc, ws) => acc + (ws.projectCount || 0), 0);
            setStats({
                totalWorkspaces: res.data.length,
                totalProjects: totalProjects,
                activeTasks: 0, // Will be calculated from projects
                completedTasks: 0
            });

            // Get recent workspaces (last 3)
            setRecentWorkspaces(res.data.slice(0, 3));
        } catch (err) {
            console.error('Failed to fetch dashboard data', err);
        }
    };

    const workspaceColor = (ws) => ws?.color || '#F97316';

    return (
        <div className="px-8 py-10">
            {/* Welcome Section */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">
                    Welcome back, {userInfo?.fullname?.split(' ')[0] || 'User'}! 👋
                </h1>
                <p className="text-gray-500 mt-2">Here's what's happening with your projects today.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-lg border p-6 hover:shadow-md transition">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center">
                            <FolderKanban className="text-blue-600" size={24} />
                        </div>
                        <TrendingUp className="text-green-500" size={20} />
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{stats.totalWorkspaces}</div>
                    <div className="text-sm text-gray-500 mt-1">Total Workspaces</div>
                </div>

                <div className="bg-white rounded-lg border p-6 hover:shadow-md transition">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 rounded-lg bg-purple-50 flex items-center justify-center">
                            <Calendar className="text-purple-600" size={24} />
                        </div>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{stats.totalProjects}</div>
                    <div className="text-sm text-gray-500 mt-1">Active Projects</div>
                </div>

                <div className="bg-white rounded-lg border p-6 hover:shadow-md transition">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 rounded-lg bg-amber-50 flex items-center justify-center">
                            <Clock className="text-amber-600" size={24} />
                        </div>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{stats.activeTasks}</div>
                    <div className="text-sm text-gray-500 mt-1">Tasks In Progress</div>
                </div>

                <div className="bg-white rounded-lg border p-6 hover:shadow-md transition">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 rounded-lg bg-green-50 flex items-center justify-center">
                            <CheckCircle2 className="text-green-600" size={24} />
                        </div>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{stats.completedTasks}</div>
                    <div className="text-sm text-gray-500 mt-1">Completed Tasks</div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Recent Workspaces */}
                <div className="bg-white rounded-lg border p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-gray-900">Recent Workspaces</h2>
                        <button 
                            onClick={() => navigate('/workspaces')}
                            className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                        >
                            View All <ArrowRight size={14} />
                        </button>
                    </div>

                    {recentWorkspaces.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <FolderKanban size={40} className="mx-auto mb-3 text-gray-300" />
                            <p className="text-sm">No workspaces yet</p>
                            <button 
                                onClick={() => navigate('/workspaces')}
                                className="mt-3 text-sm text-blue-600 hover:text-blue-700"
                            >
                                Create your first workspace
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {recentWorkspaces.map((ws) => (
                                <button
                                    key={ws._id}
                                    onClick={() => navigate(`/workspaces/${ws._id}`)}
                                    className="w-full p-3 rounded-lg border hover:border-blue-500 hover:shadow-sm transition text-left flex items-center gap-3"
                                >
                                    <div
                                        className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-semibold"
                                        style={{ backgroundColor: workspaceColor(ws) }}
                                    >
                                        {ws.name.substring(0, 1).toUpperCase()}
                                    </div>
                                    <div className="flex-1">
                                        <div className="font-semibold text-gray-900 text-sm">{ws.name}</div>
                                        <div className="text-xs text-gray-500 flex items-center gap-2">
                                            <Users size={12} />
                                            {ws.members?.length || 0} members
                                        </div>
                                    </div>
                                    <ArrowRight size={16} className="text-gray-400" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Quick Links */}
                <div className="bg-white rounded-lg border p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
                    <div className="space-y-3">
                        <button
                            onClick={() => navigate('/workspaces')}
                            className="w-full p-4 rounded-lg bg-blue-50 hover:bg-blue-100 transition text-left flex items-center gap-3"
                        >
                            <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center">
                                <FolderKanban className="text-white" size={20} />
                            </div>
                            <div>
                                <div className="font-semibold text-gray-900 text-sm">Browse Workspaces</div>
                                <div className="text-xs text-gray-600">View all your workspaces</div>
                            </div>
                        </button>

                        <button className="w-full p-4 rounded-lg bg-purple-50 hover:bg-purple-100 transition text-left flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-purple-600 flex items-center justify-center">
                                <Clock className="text-white" size={20} />
                            </div>
                            <div>
                                <div className="font-semibold text-gray-900 text-sm">My Tasks</div>
                                <div className="text-xs text-gray-600">View tasks assigned to you</div>
                            </div>
                        </button>

                        <button className="w-full p-4 rounded-lg bg-green-50 hover:bg-green-100 transition text-left flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-green-600 flex items-center justify-center">
                                <Users className="text-white" size={20} />
                            </div>
                            <div>
                                <div className="font-semibold text-gray-900 text-sm">Team Members</div>
                                <div className="text-xs text-gray-600">Manage workspace members</div>
                            </div>
                        </button>
                    </div>
                </div>
            </div>

            {/* Tips Section */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100 p-6">
                <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
                        <AlertCircle className="text-white" size={20} />
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900 mb-1">Getting Started Tip</h3>
                        <p className="text-sm text-gray-700">
                            Create a workspace to organize your projects, invite team members, and start collaborating on tasks. 
                            Use boards to visualize your workflow and track progress.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
