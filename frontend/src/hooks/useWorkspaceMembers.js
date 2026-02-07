import { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import useAuthStore from '../store/useAuthStore';
import useWorkspaceStore from '../store/useWorkspaceStore';
import {
    calculateMemberStats,
    buildTasksByUser,
    buildProjectsByUser,
    filterMembers,
} from '../utils/memberHelpers';

export const useWorkspaceMembers = () => {
    const { userInfo } = useAuthStore();
    const { currentWorkspaceId, selectedWorkspace, setSelectedWorkspace } = useWorkspaceStore();
    const [loading, setLoading] = useState(true);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [projects, setProjects] = useState([]);
    const [cards, setCards] = useState([]);
    const [search, setSearch] = useState('');
    const [openMenuId, setOpenMenuId] = useState(null);
    const [memberToRemove, setMemberToRemove] = useState(null);
    const [removingMember, setRemovingMember] = useState(false);

    const refreshWorkspace = useCallback(async () => {
        if (!currentWorkspaceId) return;
        setLoading(true);
        try {
            const [workspaceRes, projectsRes, cardsRes] = await Promise.allSettled([
                axios.get(`/api/workspaces/${currentWorkspaceId}`),
                axios.get(`/api/projects?workspaceId=${currentWorkspaceId}`),
                axios.get(`/api/board/workspace-cards?workspaceId=${currentWorkspaceId}`),
            ]);

            if (workspaceRes.status === 'fulfilled') {
                setSelectedWorkspace(workspaceRes.value.data);
            }

            setProjects(projectsRes.status === 'fulfilled' ? projectsRes.value.data || [] : []);
            setCards(cardsRes.status === 'fulfilled' ? cardsRes.value.data || [] : []);
        } catch (err) {
            console.error('Failed to load workspace members', err);
        } finally {
            setLoading(false);
        }
    }, [currentWorkspaceId, setSelectedWorkspace]);

    useEffect(() => {
        refreshWorkspace();
    }, [refreshWorkspace]);

    const workspace = selectedWorkspace?.workspace;
    const members = workspace?.members || [];

    const myRole = members.find((m) => m.user?._id === userInfo?._id)?.role;
    const isOwner = myRole === 'owner';
    const isAdmin = myRole === 'admin';
    const canInvite = isOwner || isAdmin;

    const tasksByUser = useMemo(() => buildTasksByUser(cards), [cards]);
    const projectsByUser = useMemo(() => buildProjectsByUser(projects), [projects]);
    const filteredMembers = useMemo(() => filterMembers(members, search), [members, search]);
    const stats = useMemo(() => calculateMemberStats(members, cards), [members, cards]);

    const handleRoleChange = async (userId, newRole) => {
        try {
            await axios.put(`/api/workspaces/${workspace._id}/role`, { memberId: userId, newRole });
            toast.success('Role updated');
            setOpenMenuId(null);
            refreshWorkspace();
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Failed to update role');
        }
    };

    const handleKick = (userId, fullname) => {
        setMemberToRemove({ userId, fullname });
        setOpenMenuId(null);
    };

    const confirmKick = async () => {
        if (!memberToRemove?.userId) return;
        setRemovingMember(true);
        try {
            await axios.delete(`/api/workspaces/${workspace._id}/members/${memberToRemove.userId}`);
            toast.success('Member removed');
            setMemberToRemove(null);
            refreshWorkspace();
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Failed to remove user');
        } finally {
            setRemovingMember(false);
        }
    };

    return {
        loading,
        currentWorkspaceId,
        workspace,
        members,
        filteredMembers,
        stats,
        tasksByUser,
        projectsByUser,
        myRole,
        isOwner,
        isAdmin,
        canInvite,
        userInfo,
        search,
        setSearch,
        showInviteModal,
        setShowInviteModal,
        openMenuId,
        setOpenMenuId,
        memberToRemove,
        setMemberToRemove,
        removingMember,
        handleRoleChange,
        handleKick,
        confirmKick,
        refreshWorkspace,
    };
};
