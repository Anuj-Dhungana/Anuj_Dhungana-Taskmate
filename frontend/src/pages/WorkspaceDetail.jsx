import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import {
    Plus,
    Search,
    CheckCircle2,
    Clock3,
    AlertCircle,
    Calendar as CalendarIcon,
    MoreVertical,
    Info,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import useWorkspaceStore from '../store/useWorkspaceStore';
import useAuthStore from '../store/useAuthStore';
import CreateProjectModal from '../components/modals/CreateProjectModal';
import ConfirmModal from '../components/modals/ConfirmModal';

const FILTERS = ['All', 'Active', 'Planning', 'Completed'];

const normalizeStatus = (status) => {
    const value = (status || 'Planning').toLowerCase();
    if (value === 'in progress' || value === 'active') return 'active';
    if (value === 'planning') return 'planning';
    if (value === 'completed') return 'completed';
    return value;
};

const getStatusUi = (status) => {
    const normalized = normalizeStatus(status);

    if (normalized === 'active') {
        return {
            label: 'Active',
            badge: 'bg-green-100 text-green-700 border-green-200',
            progress: 'bg-green-500',
        };
    }

    if (normalized === 'completed') {
        return {
            label: 'Completed',
            badge: 'bg-indigo-100 text-indigo-700 border-indigo-200',
            progress: 'bg-indigo-500',
        };
    }

    if (normalized === 'planning') {
        return {
            label: 'Planning',
            badge: 'bg-amber-100 text-amber-700 border-amber-200',
            progress: 'bg-amber-500',
        };
    }

    if (normalized === 'on hold') {
        return {
            label: 'On Hold',
            badge: 'bg-slate-100 text-slate-700 border-slate-200',
            progress: 'bg-slate-500',
        };
    }

    return {
        label: status || 'Planning',
        badge: 'bg-blue-100 text-blue-700 border-blue-200',
        progress: 'bg-blue-500',
    };
};

const getStatusAccentColor = (status) => {
    const normalized = normalizeStatus(status);
    if (normalized === 'active') return '#22C55E';
    if (normalized === 'completed') return '#6366F1';
    if (normalized === 'planning') return '#F59E0B';
    if (normalized === 'on hold') return '#64748B';
    return '#3B82F6';
};

const getProjectAccentColor = (project) => {
    const raw = typeof project?.projectColor === 'string' ? project.projectColor.trim() : '';
    if (/^#(?:[0-9a-fA-F]{3}){1,2}$/.test(raw)) return raw;
    return getStatusAccentColor(project?.status);
};

const getPriority = (project) => {
    const fromField = typeof project?.priority === 'string' ? project.priority : '';
    const fromTags = Array.isArray(project?.tags)
        ? project.tags.find((t) => ['high', 'medium', 'low'].includes(String(t).toLowerCase())) || ''
        : '';

    const raw = (fromField || fromTags || 'Medium').toLowerCase();
    if (raw === 'high') return 'High';
    if (raw === 'low') return 'Low';
    return 'Medium';
};

const getPriorityUi = (priority) => {
    if (priority === 'High') return 'bg-transparent text-red-600 border-red-300';
    if (priority === 'Low') return 'bg-transparent text-slate-600 border-slate-300';
    return 'bg-transparent text-blue-700 border-blue-300';
};

const formatDueDate = (value) => {
    if (!value) return 'No end date';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return 'No end date';
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};

const clampTwoLines = {
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
};

const WorkspaceDetail = () => {
    const { workspaceId } = useParams();
    const navigate = useNavigate();
    const { currentWorkspaceId, setCurrentWorkspaceId, setSelectedWorkspace } = useWorkspaceStore();
    const { userInfo } = useAuthStore();

    const [workspace, setWorkspace] = useState(null);
    const [projects, setProjects] = useState([]);
    const [workspaceCards, setWorkspaceCards] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showProjectModal, setShowProjectModal] = useState(false);
    const [search, setSearch] = useState('');
    const [activeFilter, setActiveFilter] = useState('All');
    const [openMenuProjectId, setOpenMenuProjectId] = useState(null);
    const [projectToDelete, setProjectToDelete] = useState(null);
    const [deletingProject, setDeletingProject] = useState(false);

    const effectiveWorkspaceId = workspaceId || currentWorkspaceId;

    const fetchWorkspaceDetails = useCallback(async () => {
        if (!effectiveWorkspaceId) return;

        try {
            setLoading(true);

            const [workspaceRes, cardsRes] = await Promise.allSettled([
                axios.get(`/api/workspaces/${effectiveWorkspaceId}`),
                axios.get(`/api/board/workspace-cards?workspaceId=${effectiveWorkspaceId}`),
            ]);

            if (workspaceRes.status === 'fulfilled') {
                const payload = workspaceRes.value.data;
                setWorkspace(payload.workspace);
                setProjects(payload.projects || []);
                setSelectedWorkspace(payload);
            }

            if (cardsRes.status === 'fulfilled') {
                setWorkspaceCards(cardsRes.value.data || []);
            } else {
                setWorkspaceCards([]);
            }
        } catch (err) {
            console.error('Failed to load workspace', err);
        } finally {
            setLoading(false);
        }
    }, [effectiveWorkspaceId, setSelectedWorkspace]);

    useEffect(() => {
        fetchWorkspaceDetails();
    }, [fetchWorkspaceDetails]);

    useEffect(() => {
        if (workspaceId && workspaceId !== currentWorkspaceId) {
            setCurrentWorkspaceId(workspaceId);
        }
    }, [workspaceId, currentWorkspaceId, setCurrentWorkspaceId]);

    const myRole = workspace?.members?.find((m) => m.user?._id === userInfo?._id)?.role;
    const isAdminOrOwner = myRole === 'owner' || myRole === 'admin';

    const workspaceMemberLookup = useMemo(() => {
        const map = new Map();
        (workspace?.members || []).forEach((member) => {
            if (member?.user?._id) {
                map.set(String(member.user._id), member.user);
            }
        });
        return map;
    }, [workspace]);

    const projectTaskMeta = useMemo(() => {
        const map = {};
        const now = new Date();

        workspaceCards.forEach((card) => {
            const projectId = String(card?.projectId?._id || card?.projectId || '');
            if (!projectId) return;

            if (!map[projectId]) {
                map[projectId] = { total: 0, done: 0, overdueOpen: 0 };
            }

            map[projectId].total += 1;
            const isDone = String(card?.listId?.title || '').toLowerCase() === 'done';
            if (isDone) {
                map[projectId].done += 1;
            }

            const dueDate = card?.dueDate ? new Date(card.dueDate) : null;
            if (dueDate && !Number.isNaN(dueDate.getTime()) && !isDone && dueDate < now) {
                map[projectId].overdueOpen += 1;
            }
        });

        return map;
    }, [workspaceCards]);

    const enrichedProjects = useMemo(() => {
        const now = new Date();

        return (projects || []).map((project) => {
            const projectId = String(project._id);
            const taskMeta = projectTaskMeta[projectId] || { total: 0, done: 0, overdueOpen: 0 };
            const progress = taskMeta.total > 0 ? Math.round((taskMeta.done / taskMeta.total) * 100) : 0;
            const due = project?.dueDate ? new Date(project.dueDate) : null;
            const duePast =
                due &&
                !Number.isNaN(due.getTime()) &&
                due < now &&
                normalizeStatus(project.status) !== 'completed';
            const behindSchedule = taskMeta.overdueOpen > 0 || duePast;

            const members = (project?.members || [])
                .map((m) => {
                    const memberId = String(m?.user?._id || m?.user || m || '');
                    return workspaceMemberLookup.get(memberId) || null;
                })
                .filter(Boolean);

            return {
                ...project,
                statusUi: getStatusUi(project.status),
                priority: getPriority(project),
                accentColor: getProjectAccentColor(project),
                progress,
                tasksTotal: taskMeta.total,
                tasksDone: taskMeta.done,
                behindSchedule,
                resolvedMembers: members,
            };
        });
    }, [projects, projectTaskMeta, workspaceMemberLookup]);

    const stats = useMemo(() => {
        const totalProjects = enrichedProjects.length;
        const active = enrichedProjects.filter((p) => normalizeStatus(p.status) === 'active').length;
        const completed = enrichedProjects.filter((p) => normalizeStatus(p.status) === 'completed').length;
        const behindSchedule = enrichedProjects.filter((p) => p.behindSchedule).length;

        return { totalProjects, active, completed, behindSchedule };
    }, [enrichedProjects]);

    const visibleProjects = useMemo(() => {
        const term = search.trim().toLowerCase();

        return enrichedProjects.filter((project) => {
            const statusKey = normalizeStatus(project.status);
            const statusMatch =
                activeFilter === 'All' ||
                (activeFilter === 'Active' && statusKey === 'active') ||
                (activeFilter === 'Planning' && statusKey === 'planning') ||
                (activeFilter === 'Completed' && statusKey === 'completed');

            if (!statusMatch) return false;
            if (!term) return true;

            const name = String(project.name || '').toLowerCase();
            const description = String(project.description || '').toLowerCase();
            return name.includes(term) || description.includes(term);
        });
    }, [enrichedProjects, search, activeFilter]);

    const handleProjectClick = (projectId) => {
        navigate(`/projects/${projectId}`);
    };

    const handleDeleteProject = (event, project) => {
        event.stopPropagation();
        setOpenMenuProjectId(null);

        if (!isAdminOrOwner) return;
        setProjectToDelete(project);
    };

    const confirmDeleteProject = async () => {
        if (!projectToDelete) return;
        setDeletingProject(true);

        try {
            await axios.delete(`/api/projects/${projectToDelete._id}`);
            toast.success('Project deleted');
            setProjectToDelete(null);
            fetchWorkspaceDetails();
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Failed to delete project');
        } finally {
            setDeletingProject(false);
        }
    };

    const handleProjectSettings = (event) => {
        event.stopPropagation();
        setOpenMenuProjectId(null);
        toast('Project settings coming soon');
    };

    if (!effectiveWorkspaceId) {
        return (
            <div className="px-8 py-10">
                <div className="text-center text-gray-500">Select a workspace to view projects.</div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="px-8 py-10">
                <div className="flex items-center justify-center py-20">
                    <div className="text-gray-500">Loading workspace...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="px-8 py-10" onClick={() => setOpenMenuProjectId(null)}>
            <div className="flex items-start justify-between mb-6 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
                    <p className="text-sm text-gray-500 mt-1">Manage and track all your projects</p>
                </div>

                <button
                    onClick={() => setShowProjectModal(true)}
                    className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition"
                >
                    <Plus size={16} />
                    New Project
                </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                <div className="rounded-xl border border-gray-200 bg-white p-4">
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                        <span>Total Projects</span>
                        <CheckCircle2 size={16} className="text-blue-500" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{stats.totalProjects}</div>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-4">
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                        <span>Active</span>
                        <Clock3 size={16} className="text-green-500" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{stats.active}</div>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-4">
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                        <span>Completed</span>
                        <CheckCircle2 size={16} className="text-indigo-500" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{stats.completed}</div>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-4">
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                        <span
                            className="inline-flex items-center gap-1"
                            title="Projects with overdue tasks or past end date"
                        >
                            Behind Schedule
                            <Info size={12} className="text-gray-400" />
                        </span>
                        <AlertCircle size={16} className="text-red-500" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{stats.behindSchedule}</div>
                </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-3 mb-5 flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
                <div className="relative w-full lg:max-w-xl">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search projects..."
                        className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                    />
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    {FILTERS.map((filter) => (
                        <button
                            key={filter}
                            onClick={() => setActiveFilter(filter)}
                            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
                                activeFilter === filter
                                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                            }`}
                        >
                            {filter}
                        </button>
                    ))}
                </div>
            </div>

            {projects.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-300 bg-white px-10 py-16 text-center">
                    <div className="text-lg font-semibold text-gray-800">No projects in this workspace yet</div>
                    <p className="text-sm text-gray-500 mt-1">Create your first project to get started.</p>
                    <button
                        onClick={() => setShowProjectModal(true)}
                        className="mt-5 inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition"
                    >
                        <Plus size={16} />
                        Create your first project
                    </button>
                </div>
            ) : visibleProjects.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-300 bg-white px-10 py-12 text-center text-gray-500">
                    No projects match your search.
                </div>
            ) : (
                <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {visibleProjects.map((project) => {
                        const isCreator = String(project.createdBy || '') === String(userInfo?._id || '');
                        const canEdit = isAdminOrOwner || isCreator;
                        const showMenu = canEdit;
                        const moreMembers = Math.max(0, (project.resolvedMembers || []).length - 3);

                        return (
                            <button
                                key={project._id}
                                onClick={() => handleProjectClick(project._id)}
                                className="group relative overflow-hidden text-left rounded-xl border border-gray-200 bg-white p-4 pt-5 hover:shadow-lg hover:border-gray-300 transition"
                            >
                                <div
                                    className="absolute left-0 top-0 h-1 w-full"
                                    style={{ backgroundColor: project.accentColor }}
                                />

                                <div className="flex items-start justify-between gap-2 mb-2">
                                    <div className="min-w-0">
                                        <h3 className="text-base font-semibold text-gray-900 truncate">{project.name}</h3>
                                    </div>

                                    {showMenu && (
                                        <div className="relative" onClick={(e) => e.stopPropagation()}>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setOpenMenuProjectId((prev) => (prev === project._id ? null : project._id));
                                                }}
                                                className="w-8 h-8 rounded-lg border border-transparent text-gray-400 hover:text-gray-600 hover:border-gray-200 hover:bg-gray-50 flex items-center justify-center"
                                            >
                                                <MoreVertical size={16} />
                                            </button>

                                            {openMenuProjectId === project._id && (
                                                <div className="absolute right-0 mt-1 w-36 rounded-lg border border-gray-200 bg-white shadow-lg z-20 overflow-hidden">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setOpenMenuProjectId(null);
                                                            handleProjectClick(project._id);
                                                        }}
                                                        className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-gray-50"
                                                    >
                                                        Edit
                                                    </button>

                                                    {isAdminOrOwner && (
                                                        <button
                                                            onClick={(e) => handleDeleteProject(e, project)}
                                                            className="w-full text-left px-3 py-2 text-xs text-red-600 hover:bg-red-50"
                                                        >
                                                            Delete
                                                        </button>
                                                    )}

                                                    {isAdminOrOwner && (
                                                        <button
                                                            onClick={(e) => handleProjectSettings(e, project)}
                                                            className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-gray-50"
                                                        >
                                                            Settings
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center gap-2 mb-2">
                                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${project.statusUi.badge}`}>
                                        {project.statusUi.label}
                                    </span>
                                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${getPriorityUi(project.priority)}`}>
                                        {project.priority}
                                    </span>
                                </div>

                                <p className="text-sm text-gray-600 mb-3 min-h-[40px]" style={clampTwoLines}>
                                    {project.description || 'No description provided.'}
                                </p>

                                <div className="mb-3">
                                    <div className="flex items-center justify-between text-[11px] text-gray-500 mb-1">
                                        <span>Progress</span>
                                        <span className="text-gray-800 font-semibold">{project.progress}%</span>
                                    </div>
                                    <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                                        <div
                                            className="h-full"
                                            style={{
                                                width: `${project.progress}%`,
                                                backgroundColor: project.accentColor,
                                            }}
                                        />
                                    </div>
                                    <p className="text-[11px] text-gray-500 mt-1">
                                        {project.tasksDone} / {project.tasksTotal} tasks completed
                                    </p>
                                </div>

                                <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-2">
                                    <div className="text-[11px] text-gray-500 inline-flex items-center gap-1">
                                        <CalendarIcon size={12} />
                                        <span>{formatDueDate(project.dueDate)}</span>
                                    </div>

                                    <div className="flex items-center -space-x-1">
                                        {(project.resolvedMembers || []).slice(0, 3).map((member) => (
                                            <div
                                                key={member._id}
                                                className="w-6 h-6 rounded-full border border-white bg-indigo-100 text-indigo-700 text-[10px] font-semibold flex items-center justify-center overflow-hidden"
                                                title={member.fullname}
                                            >
                                                {member.avatar ? (
                                                    <img src={member.avatar} alt={member.fullname} className="w-full h-full object-cover" />
                                                ) : (
                                                    member.fullname
                                                        ?.split(' ')
                                                        .map((p) => p[0])
                                                        .join('')
                                                        .substring(0, 2)
                                                        .toUpperCase()
                                                )}
                                            </div>
                                        ))}

                                        {moreMembers > 0 && (
                                            <div
                                                className="w-6 h-6 rounded-full border border-white bg-gray-200 text-gray-600 text-[10px] font-semibold flex items-center justify-center"
                                                title={`${moreMembers} more members`}
                                            >
                                                +{moreMembers}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            )}

            {showProjectModal && workspace && (
                <CreateProjectModal
                    isOpen={showProjectModal}
                    onClose={() => setShowProjectModal(false)}
                    workspaceId={workspace._id}
                    onCreated={fetchWorkspaceDetails}
                    members={workspace.members || []}
                />
            )}

            <ConfirmModal
                isOpen={!!projectToDelete}
                title="Delete Project"
                message={`Delete project "${projectToDelete?.name || ''}"? This action cannot be undone.`}
                confirmText="Delete"
                cancelText="Cancel"
                variant="danger"
                loading={deletingProject}
                onClose={() => !deletingProject && setProjectToDelete(null)}
                onConfirm={confirmDeleteProject}
            />
        </div>
    );
};

export default WorkspaceDetail;
