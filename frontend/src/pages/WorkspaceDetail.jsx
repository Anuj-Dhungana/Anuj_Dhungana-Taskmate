import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Plus, Grid, Kanban, Calendar as CalendarIcon, UserPlus, MessageSquare, Hash, X } from 'lucide-react';
import useWorkspaceStore from '../store/userWorkspaceStore';
import CreateProjectModal from '../components/CreateProjectModal';
import ChatArea from '../components/Chat/ChatArea';

const WorkspaceDetail = () => {
    const { workspaceId } = useParams();
    const navigate = useNavigate();
    const { setSelectedWorkspace } = useWorkspaceStore();
    const [workspace, setWorkspace] = useState(null);
    const [projects, setProjects] = useState([]);
    const [channels, setChannels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showProjectModal, setShowProjectModal] = useState(false);
    const [showChatPanel, setShowChatPanel] = useState(false);
    const [selectedChannel, setSelectedChannel] = useState(null);

    const fetchWorkspaceDetails = async () => {
        try {
            const res = await axios.get(`/api/workspaces/${workspaceId}`);
            setWorkspace(res.data.workspace);
            setProjects(res.data.projects);
            setChannels(res.data.channels || []);
            setSelectedWorkspace(res.data);
            // Auto-select the first channel (general) if available
            if (res.data.channels?.length > 0 && !selectedChannel) {
                setSelectedChannel(res.data.channels[0]);
            }
        } catch (err) {
            console.error('Failed to load workspace', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchWorkspaceDetails();
    }, [workspaceId]);

    const handleProjectCreated = () => {
        fetchWorkspaceDetails();
    };

    const handleProjectClick = (project) => {
        navigate(`/projects/${project._id}`);
    };

    const workspaceColor = (ws) => ws?.color || '#F97316';

    const memberInitials = (fullname) =>
        fullname
            ?.split(' ')
            .map((p) => p[0])
            .join('')
            .substring(0, 2)
            .toUpperCase();

    const formatDueDate = (project) => {
        if (!project?.dueDate) return null;
        const d = new Date(project.dueDate);
        if (Number.isNaN(d.getTime())) return null;
        return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const getProgress = (project) => {
        const raw = project?.progress ?? project?.completion ?? 0;
        const clamped = Math.min(100, Math.max(0, Math.round(raw)));
        return clamped;
    };

    const getTaskCount = (project) => project?.tasksCount ?? project?.taskCount ?? project?.cardsCount ?? 0;

    const statusTone = (status) => {
        switch ((status || 'Planning').toLowerCase()) {
            case 'in progress':
                return { bg: 'bg-blue-50', text: 'text-blue-700', ring: 'ring-blue-100' };
            case 'on hold':
                return { bg: 'bg-amber-50', text: 'text-amber-700', ring: 'ring-amber-100' };
            case 'completed':
                return { bg: 'bg-green-50', text: 'text-green-700', ring: 'ring-green-100' };
            default:
                return { bg: 'bg-purple-50', text: 'text-purple-700', ring: 'ring-purple-100' };
        }
    };

    if (loading) {
        return (
            <div className="px-8 py-10">
                <div className="flex items-center justify-center py-20">
                    <div className="text-gray-500">Loading workspace...</div>
                </div>
            </div>
        );
    }

    if (!workspace) {
        return (
            <div className="px-8 py-10">
                <div className="text-center text-gray-500">Workspace not found</div>
            </div>
        );
    }

    return (
        <div className="px-8 py-10">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div
                        className="w-9 h-9 rounded-md flex items-center justify-center text-white text-sm font-semibold"
                        style={{ backgroundColor: workspaceColor(workspace) }}
                    >
                        {workspace.name.substring(0, 1).toUpperCase()}
                    </div>
                    <div>
                        <h1 className="text-xl font-semibold text-gray-900">{workspace.name}</h1>
                        <p className="text-sm text-gray-500">{workspace.description || 'No description'}</p>
                        <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                            <span className="font-semibold">Members:</span>
                            <div className="flex items-center gap-1">
                                {workspace.members?.slice(0, 5).map((m) => (
                                    <span
                                        key={m.user._id}
                                        className="w-6 h-6 rounded-full bg-gray-200 text-gray-700 text-[10px] font-semibold flex items-center justify-center"
                                    >
                                        {memberInitials(m.user.fullname) || 'M'}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button className="px-3 py-2 text-sm border rounded-md text-gray-700 hover:bg-gray-50 inline-flex items-center gap-1">
                        <UserPlus size={14} /> Invite
                    </button>
                    <button
                        onClick={() => setShowProjectModal(true)}
                        className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-blue-700 transition"
                    >
                        <Plus size={16} />
                        New Project
                    </button>
                </div>
            </div>

            <h2 className="text-sm font-semibold text-gray-800 mb-2">Projects</h2>

            {projects.length === 0 ? (
                <div className="rounded-lg bg-white shadow-md px-10 py-16 flex flex-col items-center justify-center text-center text-gray-600">
                    <div className="w-12 h-12 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 mb-3">
                        <Grid size={22} />
                    </div>
                    <div className="text-sm text-gray-700 font-medium">No projects yet</div>
                    <p className="text-xs text-gray-500 mt-1">Get started by creating your first project in this workspace</p>
                    <button
                        onClick={() => setShowProjectModal(true)}
                        className="mt-4 inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-blue-700 transition"
                    >
                        <Plus size={16} />
                        Create Project
                    </button>
                </div>
            ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {projects.map((project) => (
                        <button
                            key={project._id}
                            onClick={() => handleProjectClick(project)}
                            className="p-4 rounded-lg bg-white text-left hover:shadow-lg transition shadow-md"
                        >
                            <div className="flex items-start justify-between gap-2 mb-2">
                                <div className="font-semibold text-gray-900 text-sm">{project.name}</div>
                                {(() => {
                                    const tone = statusTone(project.status);
                                    return (
                                        <span
                                            className={`text-[11px] px-2 py-1 rounded-full border ${tone.bg} ${tone.text} ${tone.ring}`}
                                        >
                                            {project.status || 'Planning'}
                                        </span>
                                    );
                                })()}
                            </div>
                            <p className="text-xs text-gray-600 mb-3 min-h-10">
                                {project.description || 'No description'}
                            </p>

                            <div className="mb-3">
                                <div className="flex items-center justify-between text-[11px] text-gray-500 mb-1">
                                    <span>Progress</span>
                                    <span className="text-gray-700 font-semibold">{getProgress(project)}%</span>
                                </div>
                                <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                                    <div
                                        className="h-full bg-blue-600 transition-all"
                                        style={{ width: `${getProgress(project)}%` }}
                                    ></div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between text-[11px] text-gray-600">
                                <span className="flex items-center gap-1">
                                    <Kanban size={12} /> {getTaskCount(project)} Tasks
                                </span>
                                <span className="flex items-center gap-1 text-gray-500">
                                    <CalendarIcon size={12} /> Due: {formatDueDate(project) || 'No due date'}
                                </span>
                            </div>
                        </button>
                    ))}
                </div>
            )}

            {showProjectModal && workspace && (
                <CreateProjectModal
                    isOpen={showProjectModal}
                    onClose={() => setShowProjectModal(false)}
                    workspaceId={workspace._id}
                    onCreated={handleProjectCreated}
                    members={workspace.members || []}
                />
            )}
        </div>
    );
};

export default WorkspaceDetail;
