import { useEffect, useState } from 'react';
import axios from 'axios';
import { ArrowRight, CheckCircle2, MessageSquare } from 'lucide-react';
import useWorkspaceStore from '../store/userWorkspaceStore';
import { useNavigate } from 'react-router-dom';

const Analytics = () => {
    const navigate = useNavigate();
    const { currentWorkspaceId } = useWorkspaceStore();
    const [projectProgress, setProjectProgress] = useState([]);
    const [activity, setActivity] = useState([]);
    const [stats, setStats] = useState({ totalProjects: 0, activeTasks: 0, completedTasks: 0 });

    useEffect(() => {
        if (currentWorkspaceId) {
            fetchAnalytics();
        }
    }, [currentWorkspaceId]);

    const fetchAnalytics = async () => {
        try {
            const res = await axios.get(`/api/board/workspace-analytics?workspaceId=${currentWorkspaceId}`);
            const data = res.data || {};
            setProjectProgress(data.projects || []);
            setActivity(data.activity || []);
            setStats(data.stats || { totalProjects: 0, activeTasks: 0, completedTasks: 0 });
        } catch (err) {
            console.error('Failed to fetch analytics', err);
        }
    };

    const projectBadgeColor = (project) => project?.status === 'Completed' ? 'bg-green-500' : 'bg-blue-500';
    const formatDate = (value) => {
        if (!value) return 'No due date';
        const d = new Date(value);
        if (Number.isNaN(d.getTime())) return 'No due date';
        return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    };
    const activityLabel = (item) => {
        if (item.type === 'message') {
            const who = item.user?.fullname || 'Someone';
            return `${who} posted in #${item.channelName}`;
        }
        if (item.type === 'project') {
            const who = item.user?.fullname ? `${item.user.fullname} created` : 'Project created';
            return item.user?.fullname ? `${who} ${item.title}` : `Project created: ${item.title}`;
        }
        return `New task: ${item.title} (${item.projectName || 'Project'})`;
    };

    if (!currentWorkspaceId) {
        return (
            <div className="px-8 py-10">
                <div className="text-center text-gray-500">Select a workspace to view analytics.</div>
            </div>
        );
    }

    return (
        <div className="px-8 py-10 bg-gradient-to-br from-gray-50 to-white min-h-screen">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
                <p className="text-gray-500 mt-2">Project progress and activity for this workspace.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <div className="bg-white rounded-2xl shadow-lg border-0 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-gray-900">Project Progress</h2>
                        <button
                            onClick={() => navigate('/projects')}
                            className="text-sm text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
                        >
                            View All <ArrowRight size={16} />
                        </button>
                    </div>

                    {projectProgress.length === 0 ? (
                        <div className="text-center text-gray-500 py-8">No projects to display.</div>
                    ) : (
                        <div className="space-y-4">
                            {projectProgress.slice(0, 8).map((project) => (
                                <div key={project._id} className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="font-semibold text-gray-900 text-sm">{project.name}</div>
                                        <span className={`text-[11px] text-white px-2 py-1 rounded-full ${projectBadgeColor(project)}`}>
                                            {project.status || 'Planning'}
                                        </span>
                                    </div>
                                    <div className="text-[11px] text-gray-500 mb-2">
                                        Due: {formatDate(project.dueDate)} • {project.doneCards}/{project.totalCards} done
                                    </div>
                                    <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
                                        <div
                                            className="h-full bg-blue-600 transition-all"
                                            style={{ width: `${project.progress || 0}%` }}
                                        ></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="bg-white rounded-2xl shadow-lg border-0 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-gray-900">Activity Feed</h2>
                        <div className="text-sm text-gray-500">Latest updates</div>
                    </div>

                    {activity.length === 0 ? (
                        <div className="text-center text-gray-500 py-8">No recent activity.</div>
                    ) : (
                        <div className="space-y-4">
                            {activity.map((item, idx) => (
                                <div key={`${item.type}-${idx}`} className="flex items-start gap-3">
                                    <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                                        {item.type === 'message' ? <MessageSquare size={16} /> : <CheckCircle2 size={16} />}
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-sm text-gray-800">{activityLabel(item)}</div>
                                        <div className="text-[11px] text-gray-400 mt-1">
                                            {item.createdAt ? new Date(item.createdAt).toLocaleString() : ''}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Analytics;
