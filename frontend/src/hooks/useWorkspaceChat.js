import { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import {
    createMemberLookup,
    processDmThreads,
    filterChannels,
    filterDMs,
    filterMembersForDm,
    selectPreferredChannel,
} from '../utils/chatHelpers';

export const useWorkspaceChat = (workspaceId, userId) => {
    const [channels, setChannels] = useState([]);
    const [dmThreads, setDmThreads] = useState([]);
    const [selectedChannel, setSelectedChannel] = useState(null);
    const [workspace, setWorkspace] = useState(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showChannelMenu, setShowChannelMenu] = useState(false);
    const [showDmPicker, setShowDmPicker] = useState(false);
    const [dmSearch, setDmSearch] = useState('');

    const loadConversations = useCallback(async (preferred) => {
        if (!workspaceId) return;
        setLoading(true);
        try {
            const [wsRes, chRes, dmRes] = await Promise.all([
                axios.get(`/api/workspaces/${workspaceId}`),
                axios.get(`/api/channels/workspace/${workspaceId}`),
                axios.get(`/api/channels/workspace/${workspaceId}/dms`),
            ]);
            setWorkspace(wsRes.data);
            const nextChannels = chRes.data || [];
            const nextDms = dmRes.data || [];
            setChannels(nextChannels);
            setDmThreads(nextDms);

            setSelectedChannel((prev) => selectPreferredChannel(nextChannels, nextDms, preferred, prev));
        } catch (err) {
            console.error('Failed to load channels', err);
        } finally {
            setLoading(false);
        }
    }, [workspaceId]);

    const refreshChannels = useCallback(async () => {
        if (!workspaceId) return;
        const [chRes, dmRes] = await Promise.all([
            axios.get(`/api/channels/workspace/${workspaceId}`),
            axios.get(`/api/channels/workspace/${workspaceId}/dms`),
        ]);
        const nextChannels = chRes.data || [];
        const nextDms = dmRes.data || [];
        setChannels(nextChannels);
        setDmThreads(nextDms);
        setSelectedChannel((prev) => selectPreferredChannel(nextChannels, nextDms, null, prev));
        if (workspace) {
            setWorkspace({ ...workspace, channels: nextChannels });
        }
    }, [workspaceId, workspace]);

    useEffect(() => {
        loadConversations();
    }, [loadConversations]);

    // Computed values
    const members = useMemo(() => workspace?.workspace?.members ?? [], [workspace?.workspace?.members]);
    const memberLookup = useMemo(() => createMemberLookup(members), [members]);
    const dmWithMeta = useMemo(() => processDmThreads(dmThreads, memberLookup, userId), [dmThreads, memberLookup, userId]);
    const filteredChannels = useMemo(() => filterChannels(channels, search), [channels, search]);
    const filteredDMs = useMemo(() => filterDMs(dmWithMeta, search), [dmWithMeta, search]);
    const dmOptions = useMemo(() => filterMembersForDm(members, dmSearch, userId), [members, dmSearch, userId]);

    const selectedConversation = useMemo(() => {
        if (!selectedChannel) return null;
        if (selectedChannel.type === 'dm') {
            return dmWithMeta.find((dm) => dm._id === selectedChannel._id) || selectedChannel;
        }
        return selectedChannel;
    }, [selectedChannel, dmWithMeta]);

    // Handler functions
    const handleCreateChannel = async () => {
        const name = prompt('Channel name');
        if (!name) return;
        try {
            await axios.post('/api/channels', { workspaceId, name });
            refreshChannels();
        } catch (err) {
            console.error('Failed to create channel', err);
        }
    };

    const handleRenameChannel = async () => {
        if (!selectedChannel) return;
        const name = prompt('New channel name', selectedChannel.name);
        if (!name || name === selectedChannel.name) return;
        try {
            await axios.put(`/api/channels/${selectedChannel._id}`, { name });
            setShowChannelMenu(false);
            refreshChannels();
        } catch (err) {
            console.error('Failed to rename channel', err);
        }
    };

    const handleCreateDM = async (memberId) => {
        try {
            const res = await axios.post('/api/channels/dm', { workspaceId, memberId });
            setShowDmPicker(false);
            setDmSearch('');
            await loadConversations(res.data);
        } catch (err) {
            console.error('Failed to create DM', err);
        }
    };

    const handleSelectChannel = (channel) => {
        setSelectedChannel(channel);
        setShowChannelMenu(false);
    };

    return {
        // State
        channels,
        dmThreads,
        selectedChannel,
        workspace,
        loading,
        search,
        showChannelMenu,
        showDmPicker,
        dmSearch,
        // Computed
        members,
        memberLookup,
        dmWithMeta,
        filteredChannels,
        filteredDMs,
        dmOptions,
        selectedConversation,
        // Setters
        setSearch,
        setShowChannelMenu,
        setShowDmPicker,
        setDmSearch,
        setSelectedChannel: handleSelectChannel,
        // Handlers
        handleCreateChannel,
        handleRenameChannel,
        handleCreateDM,
        refreshChannels,
    };
};
