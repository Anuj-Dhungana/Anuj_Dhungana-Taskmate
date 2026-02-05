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
    const { currentWorkspaceId, selectedWorkspace } = useWorkspaceStore();
    const [stats, setStats] = useState({
        totalProjects: 0,
        activeTasks: 0,
        completedTasks: 0,
    });
    const [recentProjects, setRecentProjects] = useState([]);

    useEffect(() => {
        if (currentWorkspaceId) {
            fetchDashboardData();
        }
    }, [currentWorkspaceId]);

    const fetchDashboardData = async () => {
        try {
            const [projectsRes, statsRes] = await Promise.all([
                axios.get(`/api/projects?workspaceId=${currentWorkspaceId}`),
                axios.get(`/api/board/workspace-stats?workspaceId=${currentWorkspaceId}`),
            ]);

            const projects = projectsRes.data || [];
            const wsStats = statsRes.data || {};

            setStats({
                totalProjects: projects.length,
                activeTasks: wsStats.activeTasks || 0,
                completedTasks: wsStats.completedTasks || 0,
            });

            setRecentProjects(projects.slice(0, 3));
        } catch (err) {
            console.error('Failed to fetch dashboard data', err);
        }
    };

    const projectBadgeColor = (project) => project?.status === 'Completed' ? 'bg-green-500' : 'bg-blue-500';

    return (
        <div className="px-8 py-10 bg-gradient-to-br from-gray-50 to-white min-h-screen">
            {/* Welcome Section */}
            <div className="mb-8">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Welcome back, {userInfo?.fullname?.split(' ')[0] || 'User'}! ðŸ‘‹
                </h1>
                <p className="text-gray-600 mt-3 text-lg">
                    {selectedWorkspace?.workspace?.name
                        ? `Workspace: ${selectedWorkspace.workspace.name}`
                        : 'Select a workspace to see analytics.'}
                </p>
            </div>

            {!currentWorkspaceId && (
                <div className="bg-white rounded-xl shadow-md p-6 text-gray-600">
                    Select a workspace from the sidebar to view analytics.
                </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer group">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                            <FolderKanban className="text-white" size={28} />
                        </div>
                        <TrendingUp className="text-white/80" size={20} />
                    </div>
                    <div className="text-3xl font-bold text-white">{stats.totalProjects}</div>
                    <div className="text-sm text-blue-100 mt-2 font-medium">Total Projects</div>
                </div>

                <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer group">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Calendar className="text-white" size={28} />
                        </div>
                        <div className="w-2 h-2 rounded-full bg-white/60 animate-pulse"></div>
                    </div>
                    <div className="text-3xl font-bold text-white">{stats.activeTasks}</div>
                    <div className="text-sm text-purple-100 mt-2 font-medium">Tasks In Progress</div>
                </div>

                <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-6 hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer group">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Clock className="text-white" size={28} />
                        </div>
                        <div className="w-2 h-2 rounded-full bg-white/60 animate-pulse"></div>
                    </div>
                    <div className="text-3xl font-bold text-white">{stats.completedTasks}</div>
                    <div className="text-sm text-amber-100 mt-2 font-medium">Completed Tasks</div>
                </div>

                <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer group">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                            <CheckCircle2 className="text-white" size={28} />
                        </div>
                        <TrendingUp className="text-white/80" size={20} />
                    </div>
                    <div className="text-3xl font-bold text-white">{selectedWorkspace?.workspace?.members?.length || 0}</div>
                    <div className="text-sm text-green-100 mt-2 font-medium">Workspace Members</div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Recent Projects */}
                <div className="bg-white rounded-2xl shadow-lg border-0 p-6 hover:shadow-xl transition-shadow duration-300">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-gray-900">Recent Projects</h2>
                        <div className="text-sm text-blue-600 font-semibold flex items-center gap-1">
                            Workspace <ArrowRight size={16} />
                        </div>
                    </div>

                    {recentProjects.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center mx-auto mb-4">
                                <FolderKanban size={40} className="text-blue-400" />
                            </div>
                            <p className="text-sm font-medium text-gray-700">No projects yet</p>
                            <p className="text-xs text-gray-500 mt-1">Create projects to get started</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {recentProjects.map((project) => (
                                <button
                                    key={project._id}
                                    onClick={() => navigate(`/projects/${project._id}`)}
                                    className="w-full p-4 rounded-xl bg-gradient-to-r from-gray-50 to-white border-2 border-gray-100 hover:border-blue-300 hover:shadow-md transition-all duration-300 text-left flex items-center gap-4 group"
                                >
                                    <div
                                        className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md group-hover:scale-110 transition-transform"
                                        style={{ backgroundColor: '#2563EB' }}
                                    >
                                        {project.name.substring(0, 1).toUpperCase()}
                                    </div>
                                    <div className="flex-1">
                                        <div className="font-bold text-gray-900 text-base">{project.name}</div>
                                        <div className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                                            <Users size={14} />
                                            {project.members?.length || 0} members
                                        </div>
                                    </div>
                                    <span className={`text-[11px] text-white px-2 py-1 rounded-full ${projectBadgeColor(project)}`}>
                                        {project.status || 'Planning'}
                                    </span>
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
                            onClick={() => navigate('/projects')}
                            className="w-full p-5 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 transition-all shadow-md hover:shadow-xl hover:scale-105 duration-300 text-left flex items-center gap-4 group"
                        >
                            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                                <FolderKanban className="text-white" size={24} />
                            </div>
                            <div>
                                <div className="font-bold text-white text-base">Browse Projects</div>
                                <div className="text-sm text-blue-100">View projects in this workspace</div>
                            </div>
                        </button>

                        <button
                            onClick={() => navigate('/tasks')}
                            className="w-full p-5 rounded-xl bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 transition-all shadow-md hover:shadow-xl hover:scale-105 duration-300 text-left flex items-center gap-4 group"
                        >
                            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Clock className="text-white" size={24} />
                            </div>
                            <div>
                                <div className="font-bold text-white text-base">My Tasks</div>
                                <div className="text-sm text-purple-100">Tasks assigned to you in this workspace</div>
                            </div>
                        </button>

                        <button
                            onClick={() => navigate('/members')}
                            className="w-full p-5 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 transition-all shadow-md hover:shadow-xl hover:scale-105 duration-300 text-left flex items-center gap-4 group"
                        >
                            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Users className="text-white" size={24} />
                            </div>
                            <div>
                                <div className="font-bold text-white text-base">Team Members</div>
                                <div className="text-sm text-green-100">Manage members for this workspace</div>
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
                            <h3 className="text-lg font-bold text-gray-900 mb-2">ðŸ’¡ Getting Started Tip</h3>
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
