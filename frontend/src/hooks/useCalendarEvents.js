import { useState, useCallback, useEffect } from 'react';
import axios from 'axios';
import { processProjectEvents } from '../utils/calendarHelpers';
import { addProjectDataChangedListener } from '../utils/projectEvents';

export const useCalendarEvents = (workspaceId) => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchEvents = useCallback(async () => {
        if (!workspaceId) return;
        setLoading(true);
        try {
            const [projectsRes] = await Promise.allSettled([
                axios.get(`/api/projects?workspaceId=${workspaceId}`),
            ]);
            const projects = projectsRes.status === 'fulfilled' ? projectsRes.value.data || [] : [];
            const projectEvents = processProjectEvents(projects);
            setEvents(projectEvents);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [workspaceId]);

    useEffect(() => {
        fetchEvents();
    }, [fetchEvents]);

    useEffect(() => {
        const unsubscribe = addProjectDataChangedListener((detail) => {
            if (!workspaceId) return;
            if (detail?.workspaceId && String(detail.workspaceId) !== String(workspaceId)) return;
            fetchEvents();
        });
        return unsubscribe;
    }, [workspaceId, fetchEvents]);

    return { events, loading, fetchEvents };
};
