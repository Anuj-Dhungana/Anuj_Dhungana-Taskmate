import { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import useAuthStore from '../store/useAuthStore';
import useWorkspaceStore from '../store/useWorkspaceStore';
import {
    computeDashboardStats,
    getProjectProgress,
    isOverdue,
    isDueToday,
    isDueThisWeek,
    groupUpcomingByDay,
} from '../utils/dashboardHelpers';

export const useDashboardData = () => {
    const { userInfo } = useAuthStore();
    const { currentWorkspaceId, selectedWorkspace } = useWorkspaceStore();

    const [projects, setProjects] = useState([]);
    const [allCards, setAllCards] = useState([]);
    const [myTasks, setMyTasks] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    const workspace = selectedWorkspace?.workspace;
    const members = workspace?.members || [];
    const myRole = members.find((m) => m.user?._id === userInfo?._id)?.role;
    const canInvite = myRole === 'owner' || myRole === 'admin';
    const canAccessAnalytics = myRole === 'owner' || myRole === 'admin';

    const fetchData = useCallback(async () => {
        if (!currentWorkspaceId) return;
        setLoading(true);
        try {
            const [projectsRes, cardsRes, myTasksRes, notifRes] = await Promise.allSettled([
                axios.get(`/api/projects?workspaceId=${currentWorkspaceId}`),
                axios.get(`/api/board/workspace-cards?workspaceId=${currentWorkspaceId}`),
                axios.get(`/api/board/my-tasks?workspaceId=${currentWorkspaceId}`),
                axios.get('/api/notifications'),
            ]);

            setProjects(projectsRes.status === 'fulfilled' ? projectsRes.value.data || [] : []);
            setAllCards(cardsRes.status === 'fulfilled' ? cardsRes.value.data || [] : []);
            setMyTasks(myTasksRes.status === 'fulfilled' ? myTasksRes.value.data || [] : []);
            setNotifications(notifRes.status === 'fulfilled' ? notifRes.value.data || [] : []);
        } catch (err) {
            console.error('Dashboard data error', err);
        } finally {
            setLoading(false);
        }
    }, [currentWorkspaceId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // KPI Stats
    const stats = useMemo(
        () => computeDashboardStats(projects, myTasks, allCards, members),
        [projects, myTasks, allCards, members]
    );

    // Recent projects (sorted by createdAt, max 6)
    const recentProjects = useMemo(() => {
        return [...projects]
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 6)
            .map((p) => ({ ...p, progress: getProjectProgress(p, allCards) }));
    }, [projects, allCards]);

    // My Focus Today: due today + overdue, max 6
    const focusTasks = useMemo(() => {
        const notDone = myTasks.filter((c) => {
            const listTitle = (c.listId?.title || '').toLowerCase();
            return listTitle !== 'done';
        });
        const overdue = notDone.filter((c) => isOverdue(c.dueDate));
        const dueToday = notDone.filter((c) => isDueToday(c.dueDate));
        const recent = notDone
            .filter((c) => !isOverdue(c.dueDate) && !isDueToday(c.dueDate))
            .sort((a, b) => new Date(a.dueDate || '2099-12-31') - new Date(b.dueDate || '2099-12-31'));

        return [...overdue, ...dueToday, ...recent].slice(0, 6);
    }, [myTasks]);

    // Upcoming deadlines (next 7 days)
    const upcomingEvents = useMemo(() => {
        const now = new Date();
        const weekLater = new Date();
        weekLater.setDate(now.getDate() + 7);

        const projectDeadlines = projects
            .filter((p) => p.dueDate && new Date(p.dueDate) >= now && new Date(p.dueDate) <= weekLater)
            .map((p) => ({
                id: p._id,
                title: p.name,
                date: p.dueDate,
                type: 'project',
                color: p.projectColor || '#6366F1',
            }));

        const taskDeadlines = allCards
            .filter((c) => {
                const listTitle = (c.listId?.title || '').toLowerCase();
                return listTitle !== 'done' && c.dueDate && new Date(c.dueDate) >= now && new Date(c.dueDate) <= weekLater;
            })
            .map((c) => ({
                id: c._id,
                title: c.title,
                date: c.dueDate,
                type: 'task',
                projectName: c.projectId?.name,
            }));

        const all = [...projectDeadlines, ...taskDeadlines].sort((a, b) => new Date(a.date) - new Date(b.date));
        return groupUpcomingByDay(all);
    }, [projects, allCards]);

    // Activity Feed (from notifications, max 8)
    const activityFeed = useMemo(() => {
        return notifications.slice(0, 8);
    }, [notifications]);

    return {
        loading,
        currentWorkspaceId,
        workspace,
        userInfo,
        members,
        myRole,
        canInvite,
        canAccessAnalytics,
        stats,
        recentProjects,
        focusTasks,
        upcomingEvents,
        activityFeed,
        projects,
        refreshData: fetchData,
    };
};
