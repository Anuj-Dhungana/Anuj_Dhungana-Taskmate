import { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import useChatUnreadStore from '../store/useChatUnreadStore';
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
    const unreadByWorkspace = useChatUnreadStore(
        useCallback((state) => state.unreadByWorkspace[workspaceId] || {}, [workspaceId])
    );
    const setWorkspaceChannels = useChatUnreadStore((state) => state.setWorkspaceChannels);
    const clearUnread = useChatUnreadStore((state) => state.clearUnread);
    const setActiveChannel = useChatUnreadStore((state) => state.setActiveChannel);
    const clearActiveChannel = useChatUnreadStore((state) => state.clearActiveChannel);

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
            setWorkspaceChannels(workspaceId, [...nextChannels, ...nextDms]);

            setSelectedChannel((prev) => selectPreferredChannel(nextChannels, nextDms, preferred, prev));
        } catch (err) {
            console.error('Failed to load channels', err);
        } finally {
            setLoading(false);
        }
    }, [workspaceId, setWorkspaceChannels]);

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
        setWorkspaceChannels(workspaceId, [...nextChannels, ...nextDms]);
        setSelectedChannel((prev) => selectPreferredChannel(nextChannels, nextDms, null, prev));
        if (workspace) {
            setWorkspace({ ...workspace, channels: nextChannels });
        }
    }, [workspaceId, workspace, setWorkspaceChannels]);

    useEffect(() => {
        loadConversations();
    }, [loadConversations]);

    useEffect(() => {
        if (!workspaceId) return;
        setActiveChannel({
            workspaceId,
            channelId: selectedChannel?._id || '',
        });
    }, [workspaceId, selectedChannel?._id, setActiveChannel]);

    useEffect(
        () => () => {
            if (workspaceId) {
                clearActiveChannel(workspaceId);
            }
        },
        [workspaceId, clearActiveChannel]
    );

    // Computed values
    const members = useMemo(() => workspace?.workspace?.members ?? [], [workspace?.workspace?.members]);
    const memberLookup = useMemo(() => createMemberLookup(members), [members]);
    const dmWithMeta = useMemo(
        () =>
            processDmThreads(dmThreads, memberLookup, userId).map((dm) => ({
                ...dm,
                unreadCount: unreadByWorkspace[dm._id] || 0,
            })),
        [dmThreads, memberLookup, userId, unreadByWorkspace]
    );
    const channelsWithUnread = useMemo(
        () =>
            channels.map((channel) => ({
                ...channel,
                unreadCount: unreadByWorkspace[channel._id] || 0,
            })),
        [channels, unreadByWorkspace]
    );
    const filteredChannels = useMemo(
        () => filterChannels(channelsWithUnread, search),
        [channelsWithUnread, search]
    );
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
    const handleCreateChannel = async (name) => {
        const trimmedName = String(name || '').trim();
        if (!trimmedName) {
            throw new Error('Channel name is required');
        }
        try {
            await axios.post('/api/channels', { workspaceId, name: trimmedName });
            await refreshChannels();
        } catch (err) {
            console.error('Failed to create channel', err);
            throw err;
        }
    };

    const handleRenameChannel = async (name) => {
        if (!selectedChannel) return;
        const trimmedName = String(name || '').trim();
        if (!trimmedName) {
            throw new Error('Channel name is required');
        }
        if (trimmedName === selectedChannel.name) return;
        try {
            await axios.put(`/api/channels/${selectedChannel._id}`, { name: trimmedName });
            setShowChannelMenu(false);
            await refreshChannels();
        } catch (err) {
            console.error('Failed to rename channel', err);
            throw err;
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
        if (channel?.type === 'dm' && channel?._id) {
            clearUnread({
                workspaceId,
                channelId: channel._id,
            });
        } else if (channel?._id) {
            clearUnread({
                workspaceId,
                channelId: channel._id,
            });
        }
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
