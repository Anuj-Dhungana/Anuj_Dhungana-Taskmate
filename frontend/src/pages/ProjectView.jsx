import { useCallback, useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Layout, Calendar as CalendarIcon, MoreHorizontal, Users, CalendarDays, ClipboardList } from 'lucide-react';
import BoardView from '../components/board/BoardView';
import ProjectCalendar from '../components/calendar/ProjectCalendar';
import CreateProjectModal from '../components/modals/CreateProjectModal';
import { addProjectDataChangedListener } from '../utils/projectEvents';
import useAuthStore from '../store/useAuthStore';
import useWorkspaceStore from '../store/useWorkspaceStore';

const statusColors = {
    planning: 'bg-yellow-100 text-yellow-700',
    active: 'bg-green-100 text-green-700',
    completed: 'bg-blue-100 text-blue-700',
    'on hold': 'bg-gray-100 text-gray-600',
};

const priorityColors = {
    high: 'bg-red-100 text-red-700 border border-red-200',
    medium: 'bg-orange-100 text-orange-700 border border-orange-200',
    low: 'bg-green-100 text-green-700 border border-green-200',
};

const ProjectView = () => {
    const { projectId } = useParams();
    const navigate = useNavigate();
    const { userInfo } = useAuthStore();
    const { selectedWorkspace } = useWorkspaceStore();
    const [project, setProject] = useState(null);
    const [viewMode, setViewMode] = useState('board');
    const [loading, setLoading] = useState(true);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const [boardStats, setBoardStats] = useState({ total: 0, done: 0 });

    const fetchProject = useCallback(async () => {
        try {
            const res = await axios.get(`/api/projects/${projectId}`);
            setProject(res.data);
        } catch (err) {
            console.error('Failed to load project', err);
        } finally {
            setLoading(false);
        }
    }, [projectId]);

    useEffect(() => {
        fetchProject();
    }, [fetchProject]);

    useEffect(() => {
        const unsubscribe = addProjectDataChangedListener((detail) => {
            if (detail?.projectId && String(detail.projectId) !== String(projectId)) return;
            fetchProject();
        });
        return unsubscribe;
    }, [fetchProject, projectId]);

    const handleBack = () => navigate(-1);

    const handleCloseEditModal = useCallback(() => {
        setShowEditModal(false);
    }, []);

    const handleProjectUpdated = useCallback(() => {
        fetchProject();
        setShowEditModal(false);
    }, [fetchProject]);

    const handleBoardStatsChange = useCallback((stats) => {
        setBoardStats(stats);
    }, []);

    // Permissions
    const workspace = selectedWorkspace?.workspace;
    const myRole = workspace?.members?.find((m) => m.user?._id === userInfo?._id)?.role;
    const isAdminOrOwner = myRole === 'owner' || myRole === 'admin';

    // KPI Data
    const progress = boardStats.total === 0 ? 0 : Math.round((boardStats.done / boardStats.total) * 100);
    const teamSize = project?.members?.length || 0;
    const dueDateStr = project?.dueDate
        ? new Date(project.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        : null;
    const isOverdue = project?.dueDate && new Date(project.dueDate) < new Date() && progress < 100;

    if (loading) {
        return (
            <div className="px-8 py-10 flex items-center justify-center h-[80vh]">
                <div className="text-gray-400 text-sm">Loading project...</div>
            </div>
        );
    }

    if (!project) {
        return (
            <div className="px-8 py-10 flex items-center justify-center h-[80vh]">
                <div className="text-gray-400 text-sm">Project not found</div>
            </div>
        );
    }

    const statusKey = (project.status || 'planning').toLowerCase();
    const projectPriority = project.priority || null;

    return (
        <div className="px-6 py-6 min-h-screen bg-gray-50/30">
            {/* ─── 1. Top Header ─── */}
            <div className="flex items-start justify-between mb-5">
                {/* Left: Back + Project Identity */}
                <div className="flex items-start gap-3">
                    <button
                        onClick={handleBack}
                        className="mt-1 p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
                    >
                        <ArrowLeft size={18} />
                    </button>
                    <div>
                        <div className="flex items-center gap-2.5 flex-wrap">
                            <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
                            <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full capitalize ${statusColors[statusKey] || 'bg-gray-100 text-gray-600'}`}>
                                {project.status || 'Planning'}
                            </span>
                            {projectPriority && (
                                <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full capitalize ${priorityColors[projectPriority.toLowerCase()] || 'bg-gray-100 text-gray-600'}`}>
                                    {projectPriority}
                                </span>
                            )}
                        </div>
                        {project.description && (
                            <p className="text-sm text-gray-500 mt-0.5 line-clamp-1 max-w-lg">{project.description}</p>
                        )}
                    </div>
                </div>

                {/* Right: Menu + View Toggle */}
                <div className="flex items-center gap-3">
                    {isAdminOrOwner && (
                        <div className="relative">
                            <button
                                onClick={() => setShowMenu((v) => !v)}
                                className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
                            >
                                <MoreHorizontal size={18} />
                            </button>
                            {showMenu && (
                                <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-50">
                                    <button
                                        onClick={() => { setShowEditModal(true); setShowMenu(false); }}
                                        className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition"
                                    >
                                        Edit Project
                                    </button>
                                    <button
                                        onClick={() => setShowMenu(false)}
                                        className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition"
                                    >
                                        Members
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="flex items-center bg-gray-100 p-1 rounded-lg">
                        <button
                            onClick={() => setViewMode('board')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition ${
                                viewMode === 'board' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            <Layout size={14} /> Board
                        </button>
                        <button
                            onClick={() => setViewMode('calendar')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition ${
                                viewMode === 'calendar' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            <CalendarIcon size={14} /> Calendar
                        </button>
                    </div>
                </div>
            </div>

            {/* ─── 2. KPI Summary Row ─── */}
            <div className="grid grid-cols-3 gap-4 mb-5">
                {/* Card A: Overall Progress */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                        <ClipboardList size={15} className="text-gray-400" />
                        <span>Overall Progress</span>
                    </div>
                    <div className="flex items-end justify-between">
                        <span className="text-3xl font-bold text-gray-900">{progress}%</span>
                        <span className="text-xs text-gray-400 mb-1">complete</span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full mt-3 overflow-hidden">
                        <div
                            className="h-full rounded-full transition-all duration-500 bg-green-500"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <p className="text-xs text-gray-400 mt-1.5">{boardStats.done}/{boardStats.total} tasks complete</p>
                </div>

                {/* Card B: Team Size */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                        <Users size={15} className="text-gray-400" />
                        <span>Team Size</span>
                    </div>
                    <div className="flex items-end justify-between">
                        <span className="text-3xl font-bold text-gray-900">{teamSize} member{teamSize !== 1 ? 's' : ''}</span>
                    </div>
                </div>

                {/* Card C: Due Date */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                        <CalendarDays size={15} className="text-gray-400" />
                        <span>Due Date</span>
                    </div>
                    <div className="flex items-end justify-between">
                        <span className="text-3xl font-bold text-gray-900">
                            {dueDateStr || 'No deadline'}
                        </span>
                        {isOverdue && (
                            <span className="text-xs font-semibold text-red-500 mb-1">Overdue</span>
                        )}
                    </div>
                </div>
            </div>

            {/* ─── 3. Content Area ─── */}
            {viewMode === 'board' ? (
                <BoardView
                    projectId={projectId}
                    project={project}
                    onStatsChange={handleBoardStatsChange}
                />
            ) : (
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 min-h-[60vh]">
                    <ProjectCalendar projectId={projectId} />
                </div>
            )}

            {/* Edit Modal */}
            {showEditModal && workspace && project && (
                <CreateProjectModal
                    isOpen={showEditModal}
                    onClose={handleCloseEditModal}
                    workspaceId={workspace._id}
                    onCreated={handleProjectUpdated}
                    members={workspace.members || []}
                    mode="edit"
                    project={project}
                />
            )}
        </div>
    );
};

export default ProjectView;
