import { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import useWorkspaceStore from '../store/useWorkspaceStore';
import useRealtimeSyncStore from '../store/useRealtimeSyncStore';
import { getUserRole } from '../utils/navigationConfig';

export const useDashboard = () => {
    const navigate = useNavigate();
    const { userInfo, logout } = useAuthStore();
    const {
        workspaces,
        selectedWorkspace,
        currentWorkspaceId,
        setWorkspaces,
        setSelectedWorkspace,
        setCurrentWorkspaceId,
        resetWorkspaceState,
    } = useWorkspaceStore();
    
    const [showWorkspaceModal, setShowWorkspaceModal] = useState(false);
    const [workspaceMenuOpen, setWorkspaceMenuOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const { initialize: initRealtime, joinWorkspace } = useRealtimeSyncStore();

    const handleLogout = async () => {
        await axios.post('/api/auth/logout');
        logout();
        resetWorkspaceState();
        navigate('/login');
    };

    const fetchWorkspaces = useCallback(async () => {
        try {
            const res = await axios.get('/api/workspaces');
            setWorkspaces(res.data);

            if (!currentWorkspaceId && res.data.length > 0) {
                setCurrentWorkspaceId(res.data[0]._id);
            }

            if (currentWorkspaceId && !res.data.find((w) => w._id === currentWorkspaceId)) {
                setCurrentWorkspaceId(res.data[0]?._id || null);
            }
        } catch (err) {
            console.error('Failed to load workspaces', err);
        }
    }, [currentWorkspaceId, setCurrentWorkspaceId, setWorkspaces]);

    const fetchWorkspaceDetails = useCallback(async (workspaceId) => {
        if (!workspaceId) return;
        try {
            const res = await axios.get(`/api/workspaces/${workspaceId}`);
            setSelectedWorkspace(res.data);
        } catch (err) {
            console.error('Failed to load workspace details', err);
        }
    }, [setSelectedWorkspace]);

    useEffect(() => {
        if (userInfo?._id) {
            fetchWorkspaces();
        }
    }, [userInfo?._id, fetchWorkspaces]);

    useEffect(() => {
        if (!userInfo?._id) return;
        initRealtime();
    }, [userInfo?._id, initRealtime]);

    useEffect(() => {
        if (currentWorkspaceId) {
            fetchWorkspaceDetails(currentWorkspaceId);
            joinWorkspace(currentWorkspaceId);
        }
    }, [currentWorkspaceId, fetchWorkspaceDetails, joinWorkspace]);

    const handleWorkspaceSelect = (workspaceId) => {
        setCurrentWorkspaceId(workspaceId);
        setWorkspaceMenuOpen(false);
        navigate('/dashboard');
    };

    const handleWorkspaceCreated = async (workspace) => {
        await fetchWorkspaces();
        if (workspace?._id) {
            setCurrentWorkspaceId(workspace._id);
        }
        setShowWorkspaceModal(false);
    };

    const currentWorkspace = useMemo(
        () => workspaces.find((w) => w._id === currentWorkspaceId) || null,
        [workspaces, currentWorkspaceId]
    );

    const myRole = useMemo(() => getUserRole(selectedWorkspace, userInfo?._id), [selectedWorkspace, userInfo]);

    return {
        userInfo,
        workspaces,
        currentWorkspace,
        currentWorkspaceId,
        selectedWorkspace,
        myRole,
        isCollapsed,
        setIsCollapsed,
        showWorkspaceModal,
        setShowWorkspaceModal,
        workspaceMenuOpen,
        setWorkspaceMenuOpen,
        handleLogout,
        handleWorkspaceSelect,
        handleWorkspaceCreated,
    };
};
