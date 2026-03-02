import { useState, useCallback, useEffect } from 'react';
import api from '../api';
import { processMeetingEvents, processProjectEvents } from '../utils/calendarHelpers';
import { addProjectDataChangedListener } from '../utils/projectEvents';

export const useCalendarEvents = (workspaceId) => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchEvents = useCallback(async () => {
        if (!workspaceId) return;
        setLoading(true);
        try {
            const [projectsRes, meetingsRes] = await Promise.allSettled([
                api.get(`/api/projects?workspaceId=${workspaceId}`),
                api.get(`/api/meetings?workspaceId=${workspaceId}`),
            ]);
            const projects = projectsRes.status === 'fulfilled' ? projectsRes.value.data || [] : [];
            const meetings = meetingsRes.status === 'fulfilled' ? meetingsRes.value.data || [] : [];
            const projectEvents = processProjectEvents(projects);
            const meetingEvents = processMeetingEvents(meetings);
            setEvents(
                [...projectEvents, ...meetingEvents].sort(
                    (left, right) => left.start.getTime() - right.start.getTime()
                )
            );
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
