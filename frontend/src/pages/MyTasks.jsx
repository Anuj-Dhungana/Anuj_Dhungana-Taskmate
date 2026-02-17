
import { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import {
    AlertTriangle,
    CalendarDays,
    CheckCircle2,
    ChevronDown,
    ChevronRight,
    Circle,
    Clock3,
    MessageSquare,
    Paperclip,
    Search,
    Target,
    X,
} from 'lucide-react';
import useWorkspaceStore from '../store/useWorkspaceStore';
import useAuthStore from '../store/useAuthStore';
import TaskDetailModal from '../components/board/TaskDetailModal';

const PRIORITY_STYLES = {
    High: 'bg-red-50 text-red-600 border border-red-200',
    Medium: 'bg-amber-50 text-amber-600 border border-amber-200',
    Low: 'bg-gray-50 text-gray-600 border border-gray-200',
};

const STATUS_STYLES = {
    todo: 'bg-gray-100 text-gray-600',
    inprogress: 'bg-blue-100 text-blue-700',
    completed: 'bg-emerald-100 text-emerald-700',
};

const PRIORITY_RANK = { High: 0, Medium: 1, Low: 2 };

const toPriority = (value) => {
    const normalized = String(value || 'Medium').toLowerCase();
    if (normalized === 'high') return 'High';
    if (normalized === 'low') return 'Low';
    return 'Medium';
};

const startOfDay = (value) => {
    const date = new Date(value);
    date.setHours(0, 0, 0, 0);
    return date;
};

const dayDiff = (fromDate, toDate) => {
    const from = startOfDay(fromDate).getTime();
    const to = startOfDay(toDate).getTime();
    return Math.round((to - from) / (1000 * 60 * 60 * 24));
};

const getProjectId = (task) => String(task?.projectId?._id || task?.projectId || '');
const getListTitle = (task) => String(task?.listId?.title || '').trim();
const getSubtaskStats = (task) => {
    const subtasks = task?.subtasks || [];
    const done = subtasks.filter((item) => !!item?.done).length;
    return { done, total: subtasks.length };
};

const getTaskStatus = (task) => {
    const title = getListTitle(task).toLowerCase();
    if (title.includes('done') || title.includes('complete')) return 'completed';
    if (title.includes('progress')) return 'inprogress';
    return 'todo';
};

const getUrgency = (task, now = new Date()) => {
    const status = getTaskStatus(task);
    if (status === 'completed') return 'completed';

    if (!task?.dueDate) return 'upcoming';
    const due = new Date(task.dueDate);
    if (Number.isNaN(due.getTime())) return 'upcoming';

    const diff = dayDiff(now, due);
    if (diff < 0) return 'overdue';
    if (diff <= 3) return 'dueSoon';
    return 'upcoming';
};

const getDueMeta = (task, now = new Date()) => {
    if (!task?.dueDate) return { text: 'No due date', tone: 'text-gray-400' };
    const due = new Date(task.dueDate);
    if (Number.isNaN(due.getTime())) return { text: 'No due date', tone: 'text-gray-400' };

    const diff = dayDiff(now, due);
    if (diff < 0) return { text: `Overdue by ${Math.abs(diff)}d`, tone: 'text-red-600 font-semibold' };
    if (diff === 0) return { text: 'Due Today', tone: 'text-amber-600 font-semibold' };
    return { text: `Due in ${diff}d`, tone: 'text-gray-500' };
};

const initialsFromName = (name = '') =>
    String(name)
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0])
        .join('')
        .toUpperCase() || 'U';

const MyTasks = () => {
    const { currentWorkspaceId } = useWorkspaceStore();
    const { userInfo } = useAuthStore();

    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [projectFilter, setProjectFilter] = useState('all');
    const [priorityFilter, setPriorityFilter] = useState('All');
    const [hideCompleted, setHideCompleted] = useState(false);
    const [activeKpi, setActiveKpi] = useState('all');
    const [sectionOpen, setSectionOpen] = useState({
        overdue: true,
        dueSoon: true,
        upcoming: true,
        completed: false,
    });
    const [selectedTaskId, setSelectedTaskId] = useState('');
    const [projectMembersById, setProjectMembersById] = useState({});

    const fetchTasks = useCallback(async () => {
        if (!currentWorkspaceId) return;
        setLoading(true);
        try {
            const res = await axios.get(`/api/board/my-tasks?workspaceId=${currentWorkspaceId}`);
            setTasks(res.data || []);
        } catch (err) {
            console.error('Failed to load tasks', err);
            toast.error('Failed to load tasks');
        } finally {
            setLoading(false);
        }
    }, [currentWorkspaceId]);

    useEffect(() => {
        fetchTasks();
    }, [fetchTasks]);

    const ensureProjectMembers = useCallback(
        async (projectId) => {
            if (!projectId) return [];
            if (projectMembersById[projectId]) return projectMembersById[projectId];
            try {
                const res = await axios.get(`/api/projects/${projectId}`);
                const members = Array.isArray(res.data?.members) ? res.data.members : [];
                setProjectMembersById((prev) => ({ ...prev, [projectId]: members }));
                return members;
            } catch (err) {
                console.error('Failed to load project members', err);
                setProjectMembersById((prev) => ({ ...prev, [projectId]: [] }));
                return [];
            }
        },
        [projectMembersById]
    );

    const handleOpenTask = async (task) => {
        const projectId = getProjectId(task);
        setSelectedTaskId(String(task._id));
        await ensureProjectMembers(projectId);
    };

    const toggleSection = (key) => {
        setSectionOpen((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    const scrollToSection = (key) => {
        const section = document.getElementById(`tasks-section-${key}`);
        if (!section) return;
        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    const handleKpiClick = (key) => {
        const next = activeKpi === key ? 'all' : key;
        setActiveKpi(next);

        if (next === 'overdue') {
            setSectionOpen((prev) => ({ ...prev, overdue: true }));
            setTimeout(() => scrollToSection('overdue'), 100);
        } else if (next === 'completed') {
            setSectionOpen((prev) => ({ ...prev, completed: true }));
            setTimeout(() => scrollToSection('completed'), 100);
        } else if (next === 'inprogress' || next === 'todo') {
            setTimeout(() => scrollToSection('dueSoon'), 100);
        }
    };

    const projectOptions = useMemo(() => {
        const map = new Map();
        tasks.forEach((task) => {
            const id = getProjectId(task);
            const name = task?.projectId?.name;
            if (!id || !name) return;
            map.set(id, name);
        });
        return Array.from(map.entries()).sort((a, b) => a[1].localeCompare(b[1]));
    }, [tasks]);

    const baseFilteredTasks = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        return tasks.filter((task) => {
            const priority = toPriority(task.priority);
            const projectId = getProjectId(task);
            const projectName = String(task?.projectId?.name || '').toLowerCase();
            const title = String(task?.title || '').toLowerCase();
            const description = String(task?.description || '').toLowerCase();

            if (projectFilter !== 'all' && projectId !== projectFilter) return false;
            if (priorityFilter !== 'All' && priority !== priorityFilter) return false;
            if (!query) return true;

            return title.includes(query) || description.includes(query) || projectName.includes(query);
        });
    }, [tasks, projectFilter, priorityFilter, searchQuery]);

    const kpiCounts = useMemo(() => {
        const now = new Date();
        return baseFilteredTasks.reduce(
            (acc, task) => {
                const status = getTaskStatus(task);
                const urgency = getUrgency(task, now);
                if (status === 'todo') acc.todo += 1;
                if (status === 'inprogress') acc.inProgress += 1;
                if (status === 'completed') acc.completed += 1;
                if (urgency === 'overdue') acc.overdue += 1;
                return acc;
            },
            { todo: 0, inProgress: 0, completed: 0, overdue: 0 }
        );
    }, [baseFilteredTasks]);

    const focusTodayTasks = useMemo(() => {
        const now = new Date();
        const openTasks = baseFilteredTasks.filter((task) => getTaskStatus(task) !== 'completed');

        const overdue = openTasks
            .filter((task) => getUrgency(task, now) === 'overdue')
            .sort((a, b) => new Date(a?.dueDate || 0) - new Date(b?.dueDate || 0));

        const dueToday = openTasks
            .filter((task) => {
                if (!task?.dueDate) return false;
                const due = new Date(task.dueDate);
                return !Number.isNaN(due.getTime()) && dayDiff(now, due) === 0;
            })
            .sort((a, b) => PRIORITY_RANK[toPriority(a.priority)] - PRIORITY_RANK[toPriority(b.priority)]);

        const highPriorityNearest = openTasks
            .filter((task) => {
                const urgency = getUrgency(task, now);
                if (urgency === 'overdue') return false;
                if (!task?.dueDate) return toPriority(task.priority) === 'High';
                const due = new Date(task.dueDate);
                return !Number.isNaN(due.getTime());
            })
            .sort((a, b) => {
                const priorityDelta = PRIORITY_RANK[toPriority(a.priority)] - PRIORITY_RANK[toPriority(b.priority)];
                if (priorityDelta !== 0) return priorityDelta;
                const aDue = a?.dueDate ? new Date(a.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
                const bDue = b?.dueDate ? new Date(b.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
                return aDue - bDue;
            });

        const merged = [];
        const seen = new Set();
        [...overdue, ...dueToday, ...highPriorityNearest].forEach((task) => {
            const id = String(task._id);
            if (seen.has(id)) return;
            seen.add(id);
            merged.push(task);
        });

        return merged.slice(0, 3);
    }, [baseFilteredTasks]);

    const visibleTasks = useMemo(() => {
        const now = new Date();
        return baseFilteredTasks.filter((task) => {
            const status = getTaskStatus(task);
            const urgency = getUrgency(task, now);

            if (hideCompleted && activeKpi !== 'completed' && status === 'completed') return false;

            if (activeKpi === 'todo') return status === 'todo';
            if (activeKpi === 'inprogress') return status === 'inprogress';
            if (activeKpi === 'completed') return status === 'completed';
            if (activeKpi === 'overdue') return urgency === 'overdue';
            return true;
        });
    }, [baseFilteredTasks, hideCompleted, activeKpi]);

    const groupedSections = useMemo(() => {
        const now = new Date();
        const buckets = {
            overdue: [],
            dueSoon: [],
            upcoming: [],
            completed: [],
        };

        visibleTasks.forEach((task) => {
            const urgency = getUrgency(task, now);
            if (urgency === 'overdue') buckets.overdue.push(task);
            else if (urgency === 'dueSoon') buckets.dueSoon.push(task);
            else if (urgency === 'completed') buckets.completed.push(task);
            else buckets.upcoming.push(task);
        });

        const byDueDate = (a, b) => {
            const aDue = a?.dueDate ? new Date(a.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
            const bDue = b?.dueDate ? new Date(b.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
            return aDue - bDue;
        };

        buckets.overdue.sort(byDueDate);
        buckets.dueSoon.sort(byDueDate);
        buckets.upcoming.sort(byDueDate);
        buckets.completed.sort((a, b) => new Date(b?.updatedAt || 0) - new Date(a?.updatedAt || 0));

        return buckets;
    }, [visibleTasks]);

    const selectedTask = useMemo(
        () => tasks.find((task) => String(task._id) === String(selectedTaskId)) || null,
        [tasks, selectedTaskId]
    );
    const selectedProjectId = getProjectId(selectedTask);
    const selectedProjectMembers = selectedProjectId ? projectMembersById[selectedProjectId] || [] : [];

    const sections = [
        { key: 'overdue', label: 'Overdue', empty: 'No overdue tasks', tone: 'text-red-600' },
        { key: 'dueSoon', label: 'Due Soon (Next 3 Days)', empty: 'No due soon tasks', tone: 'text-amber-600' },
        { key: 'upcoming', label: 'Upcoming', empty: 'No upcoming tasks', tone: 'text-blue-600' },
        { key: 'completed', label: 'Completed', empty: 'No completed tasks', tone: 'text-gray-600' },
    ];

    if (!currentWorkspaceId) {
        return (
            <div className="px-8 py-10">
                <div className="text-center text-gray-500">Select a workspace to view your tasks.</div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="px-8 py-10">
                <div className="text-gray-500">Loading tasks...</div>
            </div>
        );
    }

    return (
        <div className="px-8 py-8 min-h-screen bg-gray-50/50">
            <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">My Tasks</h1>
                    <p className="text-sm text-gray-500 mt-1">Tasks assigned to you in this workspace</p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <div className="relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            value={searchQuery}
                            onChange={(event) => setSearchQuery(event.target.value)}
                            placeholder="Search tasks..."
                            className="w-72 pl-9 pr-9 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                                title="Clear search"
                            >
                                <X size={12} />
                            </button>
                        )}
                    </div>

                    <select
                        value={projectFilter}
                        onChange={(event) => setProjectFilter(event.target.value)}
                        className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    >
                        <option value="all">All Projects</option>
                        {projectOptions.map(([id, name]) => (
                            <option key={id} value={id}>
                                {name}
                            </option>
                        ))}
                    </select>

                    <select
                        value={priorityFilter}
                        onChange={(event) => setPriorityFilter(event.target.value)}
                        className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    >
                        {['All', 'High', 'Medium', 'Low'].map((option) => (
                            <option key={option} value={option}>
                                {option} Priority
                            </option>
                        ))}
                    </select>

                    <button
                        onClick={() => setHideCompleted((prev) => !prev)}
                        className={`px-3 py-2 text-sm rounded-lg border transition ${
                            hideCompleted
                                ? 'bg-gray-900 text-white border-gray-900'
                                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                        }`}
                    >
                        Hide Completed
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
                <button
                    onClick={() => handleKpiClick('todo')}
                    className={`rounded-xl border p-4 text-left transition ${
                        activeKpi === 'todo'
                            ? 'border-gray-900 bg-gray-900 text-white shadow-sm'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                >
                    <div className="flex items-center gap-2 text-sm">
                        <Circle size={14} />
                        <span>To Do</span>
                    </div>
                    <div className="text-3xl font-bold mt-2">{kpiCounts.todo}</div>
                </button>

                <button
                    onClick={() => handleKpiClick('inprogress')}
                    className={`rounded-xl border p-4 text-left transition ${
                        activeKpi === 'inprogress'
                            ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                >
                    <div className="flex items-center gap-2 text-sm">
                        <Clock3 size={14} />
                        <span>In Progress</span>
                    </div>
                    <div className="text-3xl font-bold mt-2">{kpiCounts.inProgress}</div>
                </button>

                <button
                    onClick={() => handleKpiClick('completed')}
                    className={`rounded-xl border p-4 text-left transition ${
                        activeKpi === 'completed'
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                >
                    <div className="flex items-center gap-2 text-sm">
                        <CheckCircle2 size={14} />
                        <span>Completed</span>
                    </div>
                    <div className="text-3xl font-bold mt-2">{kpiCounts.completed}</div>
                </button>

                <button
                    onClick={() => handleKpiClick('overdue')}
                    className={`rounded-xl border p-4 text-left transition ${
                        activeKpi === 'overdue'
                            ? 'border-red-500 bg-red-50 text-red-700 shadow-sm'
                            : 'border-red-200 bg-red-50/70 text-red-700 hover:border-red-300'
                    }`}
                >
                    <div className="flex items-center gap-2 text-sm">
                        <AlertTriangle size={14} />
                        <span>Overdue</span>
                    </div>
                    <div className="text-3xl font-bold mt-2">{kpiCounts.overdue}</div>
                </button>
            </div>

            <section className="rounded-2xl border border-gray-200 bg-white p-4 mb-6">
                <div className="flex items-center gap-2 mb-3">
                    <Target size={16} className="text-violet-600" />
                    <h2 className="text-sm font-semibold text-gray-900">Focus Today</h2>
                </div>
                {focusTodayTasks.length === 0 ? (
                    <p className="text-sm text-gray-400">No urgent tasks right now.</p>
                ) : (
                    <div className="flex gap-3 overflow-x-auto pb-1">
                        {focusTodayTasks.map((task) => {
                            const dueMeta = getDueMeta(task);
                            const priority = toPriority(task.priority);
                            return (
                                <button
                                    key={task._id}
                                    onClick={() => handleOpenTask(task)}
                                    className="min-w-[230px] rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-left hover:border-blue-300 hover:bg-blue-50/40 transition"
                                >
                                    <p className="text-sm font-semibold text-gray-900 line-clamp-1">{task.title}</p>
                                    <div className="mt-1 flex items-center justify-between text-xs">
                                        <span
                                            className={`px-2 py-0.5 rounded-full ${
                                                dueMeta.tone.includes('red')
                                                    ? 'bg-red-100 text-red-700'
                                                    : dueMeta.tone.includes('amber')
                                                      ? 'bg-amber-100 text-amber-700'
                                                      : 'bg-gray-100 text-gray-600'
                                            }`}
                                        >
                                            {dueMeta.text}
                                        </span>
                                        <span className="inline-flex items-center gap-1 text-gray-500">
                                            <span
                                                className={`w-2 h-2 rounded-full ${
                                                    priority === 'High'
                                                        ? 'bg-red-500'
                                                        : priority === 'Medium'
                                                          ? 'bg-amber-500'
                                                          : 'bg-gray-400'
                                                }`}
                                            />
                                            {priority}
                                        </span>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}
            </section>

            {tasks.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center text-gray-600 font-medium">
                    There are no tasks assigned to you.
                </div>
            ) : visibleTasks.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center text-gray-500">
                    No tasks match your current filters.
                </div>
            ) : (
                <div className="space-y-4">
                    {sections
                        .filter((section) => !hideCompleted || section.key !== 'completed' || activeKpi === 'completed')
                        .map((section) => {
                            const items = groupedSections[section.key];
                            const isOpen = sectionOpen[section.key];
                            return (
                                <section
                                    key={section.key}
                                    id={`tasks-section-${section.key}`}
                                    className="rounded-2xl border border-gray-200 bg-white"
                                >
                                    <button
                                        type="button"
                                        onClick={() => toggleSection(section.key)}
                                        className="w-full flex items-center justify-between px-4 py-3 border-b border-gray-100"
                                    >
                                        <div className="flex items-center gap-2">
                                            {isOpen ? (
                                                <ChevronDown size={15} className="text-gray-400" />
                                            ) : (
                                                <ChevronRight size={15} className="text-gray-400" />
                                            )}
                                            <h3 className={`text-sm font-semibold ${section.tone}`}>
                                                {section.label} ({items.length})
                                            </h3>
                                        </div>
                                    </button>

                                    {isOpen && (
                                        <div className="p-3 grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-3">
                                            {items.length === 0 ? (
                                                <div className="col-span-full px-3 py-5 text-sm text-gray-400">
                                                    {section.empty}
                                                </div>
                                            ) : (
                                                items.map((task) => {
                                                    const now = new Date();
                                                    const urgency = getUrgency(task, now);
                                                    const dueMeta = getDueMeta(task, now);
                                                    const status = getTaskStatus(task);
                                                    const statusLabel = getListTitle(task) || 'To Do';
                                                    const priority = toPriority(task.priority);
                                                    const { done, total } = getSubtaskStats(task);
                                                    const subtaskProgress = total > 0 ? Math.round((done / total) * 100) : 0;
                                                    const attachmentCount = task?.attachments?.length || 0;
                                                    const commentCount = task?.comments?.length || 0;
                                                    const rowAssignee =
                                                        (task?.assignees || []).find(
                                                            (assignee) =>
                                                                String(assignee?._id || assignee) === String(userInfo?._id || '')
                                                        ) || task?.assignees?.[0];
                                                    const rowAssigneeName = rowAssignee?.fullname || userInfo?.fullname || 'You';
                                                    const rowAssigneeAvatar = rowAssignee?.avatar || userInfo?.avatar || '';
                                                    const isOverdue = urgency === 'overdue';

                                                    return (
                                                        <div
                                                            key={task._id}
                                                            role="button"
                                                            tabIndex={0}
                                                            onClick={() => handleOpenTask(task)}
                                                            onKeyDown={(event) => {
                                                                if (event.key === 'Enter' || event.key === ' ') {
                                                                    event.preventDefault();
                                                                    handleOpenTask(task);
                                                                }
                                                            }}
                                                            className="bg-white p-4 rounded-xl border border-gray-200 touch-none transition-all group cursor-pointer hover:border-gray-300 hover:shadow-md"
                                                        >
                                                            <div className="flex items-center justify-between mb-2">
                                                                <div className="flex items-center gap-2">
                                                                    <span
                                                                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                                                                            PRIORITY_STYLES[priority]
                                                                        }`}
                                                                    >
                                                                        {priority}
                                                                    </span>
                                                                    <span
                                                                        className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                                                                            STATUS_STYLES[status]
                                                                        }`}
                                                                    >
                                                                        {statusLabel}
                                                                    </span>
                                                                </div>
                                                                {isOverdue && (
                                                                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                                                                        <AlertTriangle size={10} />
                                                                        Overdue
                                                                    </span>
                                                                )}
                                                            </div>

                                                            <h4 className="text-sm font-semibold text-gray-800 leading-snug">
                                                                {task.title}
                                                            </h4>

                                                            {task.description && (
                                                                <p className="text-xs text-gray-400 mt-1 line-clamp-1">
                                                                    {task.description}
                                                                </p>
                                                            )}

                                                            <div className="text-xs text-gray-500 mt-1.5">
                                                                {task?.projectId?.name || 'Project'}
                                                            </div>

                                                            {total > 0 && (
                                                                <div className="mt-3">
                                                                    <div className="flex items-center justify-between mb-1.5">
                                                                        <span className="text-[11px] font-medium text-indigo-600">
                                                                            Subtasks
                                                                        </span>
                                                                        <span className="text-[11px] font-semibold text-gray-600">
                                                                            {done}/{total}
                                                                        </span>
                                                                    </div>
                                                                    <div className="h-1.5 rounded-full bg-gray-200 overflow-hidden">
                                                                        <div
                                                                            className="h-full bg-violet-500 transition-all"
                                                                            style={{ width: `${subtaskProgress}%` }}
                                                                        />
                                                                    </div>
                                                                </div>
                                                            )}

                                                            <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-gray-100">
                                                                <div className="flex items-center gap-3 text-gray-400">
                                                                    {task?.dueDate && (
                                                                        <span className={`flex items-center gap-1 text-[11px] ${dueMeta.tone}`}>
                                                                            {isOverdue ? <AlertTriangle size={12} /> : <CalendarDays size={12} />}
                                                                            {dueMeta.text}
                                                                        </span>
                                                                    )}
                                                                    {attachmentCount > 0 && (
                                                                        <span className="flex items-center gap-1 text-[11px]">
                                                                            <Paperclip size={12} />
                                                                            {attachmentCount}
                                                                        </span>
                                                                    )}
                                                                    {commentCount > 0 && (
                                                                        <span className="flex items-center gap-1 text-[11px]">
                                                                            <MessageSquare size={12} />
                                                                            {commentCount}
                                                                        </span>
                                                                    )}
                                                                </div>

                                                                <div className="flex items-center gap-2">
                                                                    {rowAssigneeAvatar ? (
                                                                        <img
                                                                            src={rowAssigneeAvatar}
                                                                            alt={rowAssigneeName}
                                                                            className="w-6 h-6 rounded-full object-cover border border-gray-200"
                                                                            title={rowAssigneeName}
                                                                        />
                                                                    ) : (
                                                                        <div
                                                                            className="w-6 h-6 rounded-full bg-gray-200 text-[10px] font-semibold text-gray-700 flex items-center justify-center border border-gray-200"
                                                                            title={rowAssigneeName}
                                                                        >
                                                                            {initialsFromName(rowAssigneeName)}
                                                                        </div>
                                                                    )}

                                                                    <ChevronRight size={16} className="text-gray-400" />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })
                                            )}
                                        </div>
                                    )}
                                </section>
                            );
                        })}
                </div>
            )}

            <TaskDetailModal
                isOpen={!!selectedTask}
                onClose={() => setSelectedTaskId('')}
                card={selectedTask}
                projectMembers={selectedProjectMembers}
                onUpdate={fetchTasks}
            />
        </div>
    );
};

export default MyTasks;
