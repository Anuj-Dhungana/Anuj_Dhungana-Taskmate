import { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import useAuthStore from '../store/useAuthStore';
import useWorkspaceStore from '../store/useWorkspaceStore';
import {
    computeDashboardStats,
    getProjectProgress,
    isOverdue,
    isDueToday,
    groupUpcomingByDay,
} from '../utils/dashboardHelpers';
import { getProjectLabel } from '../utils/projectHelpers';

export const useDashboardData = () => {
    const { userInfo } = useAuthStore();
    const { currentWorkspaceId, selectedWorkspace } = useWorkspaceStore();

    const [projects, setProjects] = useState([]);
    const [allCards, setAllCards] = useState([]);
    const [myTasks, setMyTasks] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [analyticsActivity, setAnalyticsActivity] = useState([]);
    const [loading, setLoading] = useState(true);

    const workspace = selectedWorkspace?.workspace;
    const members = useMemo(() => workspace?.members ?? [], [workspace?.members]);
    const myRole = members.find((m) => m.user?._id === userInfo?._id)?.role;
    const canInvite = myRole === 'owner' || myRole === 'admin';
    const canAccessAnalytics = myRole === 'owner' || myRole === 'admin';

    const formatAnalyticsActivity = useCallback((item, index) => {
        const sender = item?.user || { fullname: 'System' };
        let message = 'updated the workspace';

        if (item?.type === 'message') {
            message = `posted in #${item.channelName || 'general'}`;
        } else if (item?.type === 'project') {
            message = item?.title ? `created ${item.title}` : 'created a project';
        } else if (item?.type === 'task') {
            message = `added task ${item?.title || 'Untitled'}${item?.projectName ? ` in ${item.projectName}` : ''}`;
        }

        return {
            _id: item?._id || `${item?.type || 'activity'}-${item?.createdAt || index}-${index}`,
            sender,
            type: item?.type || 'activity',
            message,
            createdAt: item?.createdAt || new Date().toISOString(),
        };
    }, []);

    const fetchData = useCallback(async () => {
        if (!currentWorkspaceId) return;
        setLoading(true);
        try {
            const [projectsRes, cardsRes, myTasksRes, notifRes, analyticsRes] = await Promise.allSettled([
                axios.get(`/api/projects?workspaceId=${currentWorkspaceId}`),
                axios.get(`/api/board/workspace-cards?workspaceId=${currentWorkspaceId}`),
                axios.get(`/api/board/my-tasks?workspaceId=${currentWorkspaceId}`),
                axios.get('/api/notifications'),
                axios.get(`/api/board/workspace-analytics?workspaceId=${currentWorkspaceId}`),
            ]);

            setProjects(projectsRes.status === 'fulfilled' ? projectsRes.value.data || [] : []);
            setAllCards(cardsRes.status === 'fulfilled' ? cardsRes.value.data || [] : []);
            setMyTasks(myTasksRes.status === 'fulfilled' ? myTasksRes.value.data || [] : []);
            setNotifications(notifRes.status === 'fulfilled' ? notifRes.value.data || [] : []);
            setAnalyticsActivity(
                analyticsRes.status === 'fulfilled' ? analyticsRes.value.data?.activity || [] : []
            );
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
        const now = new Date();
        return [...projects]
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 6)
            .map((p) => {
                const progress = getProjectProgress(p, allCards);
                const label = getProjectLabel(p);
                
                // Check if behind schedule
                const dueDate = p.dueDate ? new Date(p.dueDate) : null;
                const isOverdue = dueDate && dueDate < now && (p.status || '').toLowerCase() !== 'completed';
                
                // Check for overdue tasks
                const projectCards = allCards.filter(c => {
                    const cardProjectId = c.projectId?._id || c.projectId;
                    return String(cardProjectId) === String(p._id);
                });
                const hasOverdueTasks = projectCards.some(c => {
                    const cardDue = c.dueDate ? new Date(c.dueDate) : null;
                    const isDone = (c.listId?.title || '').toLowerCase() === 'done';
                    return cardDue && cardDue < now && !isDone;
                });
                
                return { ...p, progress, label, behindSchedule: isOverdue || hasOverdueTasks };
            });
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

    // Activity Feed (prefer analytics activity, fallback to notifications)
    const activityFeed = useMemo(() => {
        if (analyticsActivity.length > 0) {
            return analyticsActivity.slice(0, 8).map((item, index) => formatAnalyticsActivity(item, index));
        }
        return notifications.slice(0, 8);
    }, [analyticsActivity, notifications, formatAnalyticsActivity]);

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
