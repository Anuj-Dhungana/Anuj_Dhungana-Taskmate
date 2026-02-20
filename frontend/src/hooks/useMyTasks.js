import { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import useWorkspaceStore from '../store/useWorkspaceStore';
import useAuthStore from '../store/useAuthStore';
import {
    PRIORITY_RANK,
    dayDiff,
    getProjectId,
    getTaskStatus,
    getUrgency,
    toPriority,
} from '../utils/taskHelpers';

const useMyTasks = () => {
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

    // ── Data fetching ─────────────────────────────────────────────────────

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

    // ── Callbacks ─────────────────────────────────────────────────────────

    const handleOpenTask = useCallback(
        async (task) => {
            const projectId = getProjectId(task);
            setSelectedTaskId(String(task._id));
            await ensureProjectMembers(projectId);
        },
        [ensureProjectMembers]
    );

    const handleCloseTask = useCallback(() => setSelectedTaskId(''), []);

    const toggleSection = useCallback((key) => {
        setSectionOpen((prev) => ({ ...prev, [key]: !prev[key] }));
    }, []);

    const scrollToSection = useCallback((key) => {
        const section = document.getElementById(`tasks-section-${key}`);
        if (!section) return;
        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, []);

    const handleKpiClick = useCallback(
        (key) => {
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
        },
        [activeKpi, scrollToSection]
    );

    // ── Memos ─────────────────────────────────────────────────────────────

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
        const buckets = { overdue: [], dueSoon: [], upcoming: [], completed: [] };

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

    return {
        // workspace / auth
        currentWorkspaceId,
        userInfo,
        // data
        tasks,
        loading,
        // filters
        searchQuery,
        setSearchQuery,
        projectFilter,
        setProjectFilter,
        priorityFilter,
        setPriorityFilter,
        hideCompleted,
        setHideCompleted,
        // computed lists
        projectOptions,
        baseFilteredTasks,
        kpiCounts,
        focusTodayTasks,
        visibleTasks,
        groupedSections,
        // kpi state
        activeKpi,
        handleKpiClick,
        // section state
        sectionOpen,
        toggleSection,
        // task modal
        selectedTask,
        selectedProjectId,
        selectedProjectMembers,
        handleOpenTask,
        handleCloseTask,
        fetchTasks,
    };
};

export default useMyTasks;
