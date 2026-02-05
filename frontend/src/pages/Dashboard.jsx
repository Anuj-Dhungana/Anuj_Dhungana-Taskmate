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
        <div className="px-8 py-10 bg-gradient-to-br from-gray-50 to-white min-h-screen">
            {/* Welcome Section */}
            <div className="mb-8">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Welcome back, {userInfo?.fullname?.split(' ')[0] || 'User'}! 👋
                </h1>
                <p className="text-gray-600 mt-3 text-lg">Here's what's happening with your projects today.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer group">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                            <FolderKanban className="text-white" size={28} />
                        </div>
                        <TrendingUp className="text-white/80" size={20} />
                    </div>
                    <div className="text-3xl font-bold text-white">{stats.totalWorkspaces}</div>
                    <div className="text-sm text-blue-100 mt-2 font-medium">Total Workspaces</div>
                </div>

                <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer group">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Calendar className="text-white" size={28} />
                        </div>
                        <div className="w-2 h-2 rounded-full bg-white/60 animate-pulse"></div>
                    </div>
                    <div className="text-3xl font-bold text-white">{stats.totalProjects}</div>
                    <div className="text-sm text-purple-100 mt-2 font-medium">Active Projects</div>
                </div>

                <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-6 hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer group">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Clock className="text-white" size={28} />
                        </div>
                        <div className="w-2 h-2 rounded-full bg-white/60 animate-pulse"></div>
                    </div>
                    <div className="text-3xl font-bold text-white">{stats.activeTasks}</div>
                    <div className="text-sm text-amber-100 mt-2 font-medium">Tasks In Progress</div>
                </div>

                <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer group">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                            <CheckCircle2 className="text-white" size={28} />
                        </div>
                        <TrendingUp className="text-white/80" size={20} />
                    </div>
                    <div className="text-3xl font-bold text-white">{stats.completedTasks}</div>
                    <div className="text-sm text-green-100 mt-2 font-medium">Completed Tasks</div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Recent Workspaces */}
                <div className="bg-white rounded-2xl shadow-lg border-0 p-6 hover:shadow-xl transition-shadow duration-300">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-gray-900">Recent Workspaces</h2>
                        <button 
                            onClick={() => navigate('/workspaces')}
                            className="text-sm text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1 hover:gap-2 transition-all"
                        >
                            View All <ArrowRight size={16} />
                        </button>
                    </div>

                    {recentWorkspaces.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center mx-auto mb-4">
                                <FolderKanban size={40} className="text-blue-400" />
                            </div>
                            <p className="text-sm font-medium text-gray-700">No workspaces yet</p>
                            <button 
                                onClick={() => navigate('/workspaces')}
                                className="mt-4 px-5 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-semibold rounded-xl hover:shadow-lg transition-all"
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
                                    className="w-full p-4 rounded-xl bg-gradient-to-r from-gray-50 to-white border-2 border-gray-100 hover:border-blue-300 hover:shadow-md transition-all duration-300 text-left flex items-center gap-4 group"
                                >
                                    <div
                                        className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md group-hover:scale-110 transition-transform"
                                        style={{ backgroundColor: workspaceColor(ws) }}
                                    >
                                        {ws.name.substring(0, 1).toUpperCase()}
                                    </div>
                                    <div className="flex-1">
                                        <div className="font-bold text-gray-900 text-base">{ws.name}</div>
                                        <div className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                                            <Users size={14} />
                                            {ws.members?.length || 0} members
                                        </div>
                                    </div>
                                    <ArrowRight size={20} className="text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Quick Links */}
                <div className="bg-white rounded-2xl shadow-lg border-0 p-6 hover:shadow-xl transition-shadow duration-300">
                    <h2 className="text-xl font-bold text-gray-900 mb-6">Quick Actions</h2>
                    <div className="space-y-4">
                        <button
                            onClick={() => navigate('/workspaces')}
                            className="w-full p-5 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 transition-all shadow-md hover:shadow-xl hover:scale-105 duration-300 text-left flex items-center gap-4 group"
                        >
                            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                                <FolderKanban className="text-white" size={24} />
                            </div>
                            <div>
                                <div className="font-bold text-white text-base">Browse Workspaces</div>
                                <div className="text-sm text-blue-100">View all your workspaces</div>
                            </div>
                        </button>

                        <button className="w-full p-5 rounded-xl bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 transition-all shadow-md hover:shadow-xl hover:scale-105 duration-300 text-left flex items-center gap-4 group">
                            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Clock className="text-white" size={24} />
                            </div>
                            <div>
                                <div className="font-bold text-white text-base">My Tasks</div>
                                <div className="text-sm text-purple-100">View tasks assigned to you</div>
                            </div>
                        </button>

                        <button className="w-full p-5 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 transition-all shadow-md hover:shadow-xl hover:scale-105 duration-300 text-left flex items-center gap-4 group">
                            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Users className="text-white" size={24} />
                            </div>
                            <div>
                                <div className="font-bold text-white text-base">Team Members</div>
                                <div className="text-sm text-green-100">Manage workspace members</div>
                            </div>
                        </button>
                    </div>
                </div>
            </div>

            {/* Tips Section */}
            <div className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-2xl shadow-xl p-1">
                <div className="bg-white rounded-2xl p-6">
                    <div className="flex items-start gap-4">
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shrink-0 shadow-lg">
                            <AlertCircle className="text-white" size={26} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">💡 Getting Started Tip</h3>
                            <p className="text-sm text-gray-600 leading-relaxed">
                                Create a workspace to organize your projects, invite team members, and start collaborating on tasks. 
                                Use boards to visualize your workflow and track progress efficiently.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;