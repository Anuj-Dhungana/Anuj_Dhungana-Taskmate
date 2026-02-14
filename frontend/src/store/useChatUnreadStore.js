import { create } from 'zustand';

const toStr = (value) => String(value || '');

const useChatUnreadStore = create((set, get) => ({
    channelTypeByWorkspace: {},
    unreadByWorkspace: {},
    activeChannelByWorkspace: {},

    setWorkspaceChannels: (workspaceId, channels = []) =>
        set((state) => {
            const wid = toStr(workspaceId);
            if (!wid) return {};

            const typeMap = {};
            (Array.isArray(channels) ? channels : []).forEach((channel) => {
                const channelId = toStr(channel?._id || channel?.id || channel);
                if (!channelId) return;
                const type =
                    channel?.type === 'dm' ? 'dm' : 'channel';
                typeMap[channelId] = type;
            });

            const currentUnread = state.unreadByWorkspace[wid] || {};
            const nextUnread = {};
            Object.keys(typeMap).forEach((channelId) => {
                nextUnread[channelId] = currentUnread[channelId] || 0;
            });

            return {
                channelTypeByWorkspace: {
                    ...state.channelTypeByWorkspace,
                    [wid]: typeMap,
                },
                unreadByWorkspace: {
                    ...state.unreadByWorkspace,
                    [wid]: nextUnread,
                },
            };
        }),

    isWorkspaceChannel: (workspaceId, channelId) => {
        const wid = toStr(workspaceId);
        const cid = toStr(channelId);
        if (!wid || !cid) return false;
        const typeMap = get().channelTypeByWorkspace[wid] || {};
        return Boolean(typeMap[cid]);
    },

    getChannelType: (workspaceId, channelId) => {
        const wid = toStr(workspaceId);
        const cid = toStr(channelId);
        if (!wid || !cid) return '';
        const typeMap = get().channelTypeByWorkspace[wid] || {};
        return typeMap[cid] || '';
    },

    incrementUnread: ({ workspaceId, channelId }) =>
        set((state) => {
            const wid = toStr(workspaceId);
            const cid = toStr(channelId);
            if (!wid || !cid) return {};

            const workspaceUnread = state.unreadByWorkspace[wid] || {};
            return {
                unreadByWorkspace: {
                    ...state.unreadByWorkspace,
                    [wid]: {
                        ...workspaceUnread,
                        [cid]: (workspaceUnread[cid] || 0) + 1,
                    },
                },
            };
        }),

    clearUnread: ({ workspaceId, channelId }) =>
        set((state) => {
            const wid = toStr(workspaceId);
            const cid = toStr(channelId);
            if (!wid || !cid) return {};

            const workspaceUnread = state.unreadByWorkspace[wid] || {};
            if (!workspaceUnread[cid]) return {};

            return {
                unreadByWorkspace: {
                    ...state.unreadByWorkspace,
                    [wid]: {
                        ...workspaceUnread,
                        [cid]: 0,
                    },
                },
            };
        }),

    setActiveChannel: ({ workspaceId, channelId }) =>
        set((state) => {
            const wid = toStr(workspaceId);
            if (!wid) return {};
            return {
                activeChannelByWorkspace: {
                    ...state.activeChannelByWorkspace,
                    [wid]: toStr(channelId),
                },
            };
        }),

    clearActiveChannel: (workspaceId) =>
        set((state) => {
            const wid = toStr(workspaceId);
            if (!wid) return {};
            return {
                activeChannelByWorkspace: {
                    ...state.activeChannelByWorkspace,
                    [wid]: '',
                },
            };
        }),

    clearWorkspaceUnread: (workspaceId) =>
        set((state) => {
            const wid = toStr(workspaceId);
            if (!wid) return {};
            return {
                unreadByWorkspace: {
                    ...state.unreadByWorkspace,
                    [wid]: {},
                },
            };
        }),
}));

export default useChatUnreadStore;
