import { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { addProjectDataChangedListener } from '../utils/projectEvents';
import { normalizeStatus, getStatusUi, getProjectAccentColor, getPriority } from '../utils/projectHelpers';

export const useWorkspaceProjects = (effectiveWorkspaceId, setSelectedWorkspace) => {
    const [workspace, setWorkspace] = useState(null);
    const [projects, setProjects] = useState([]);
    const [workspaceCards, setWorkspaceCards] = useState([]);
    const [loading, setLoading] = useState(true);

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
        const unsubscribe = addProjectDataChangedListener((detail) => {
            if (!effectiveWorkspaceId) return;
            if (detail?.workspaceId && String(detail.workspaceId) !== String(effectiveWorkspaceId)) return;
            fetchWorkspaceDetails();
        });
        return unsubscribe;
    }, [effectiveWorkspaceId, fetchWorkspaceDetails]);

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

    return {
        workspace,
        projects,
        enrichedProjects,
        loading,
        fetchWorkspaceDetails,
    };
};
