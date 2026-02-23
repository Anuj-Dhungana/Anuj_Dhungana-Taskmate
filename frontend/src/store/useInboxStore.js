import { create } from 'zustand';
import { inviteAPI } from '../api/invites';
import { notificationAPI } from '../api/notifications';

const normalizeNotification = (notification = {}) => {
    const rawId = notification?._id || notification?.id;
    const fallbackId = [
        notification?.type || 'info',
        notification?.relatedId || '',
        notification?.message || '',
        notification?.createdAt || Date.now(),
    ].join(':');

    return {
        ...notification,
        _id: String(rawId || fallbackId),
        isRead: Boolean(notification?.isRead),
        createdAt: notification?.createdAt || new Date().toISOString(),
    };
};

const sortNotifications = (notifications = []) =>
    [...notifications].sort(
        (a, b) => new Date(b?.createdAt || 0).getTime() - new Date(a?.createdAt || 0).getTime()
    );

const toInviteId = (invite) => String(invite?._id || invite?.id || '');

const useInboxStore = create((set, get) => ({
    notifications: [],
    invites: [],
    mentions: [],
    unreadMentionCount: 0,
    loadingNotifications: false,
    loadingInvites: false,
    loadingMentions: false,
    processingInviteId: '',

    fetchNotifications: async () => {
        set({ loadingNotifications: true });
        try {
            const res = await notificationAPI.getAll();
            const list = Array.isArray(res?.data) ? res.data : [];
            set({ notifications: sortNotifications(list.map(normalizeNotification)) });
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        } finally {
            set({ loadingNotifications: false });
        }
    },

    fetchInvites: async () => {
        set({ loadingInvites: true });
        try {
            const res = await inviteAPI.getMyInvites();
            const list = Array.isArray(res?.data) ? res.data : [];
            set({ invites: list });
        } catch (error) {
            console.error('Failed to fetch invites:', error);
        } finally {
            set({ loadingInvites: false });
        }
    },

    fetchMentions: async () => {
        set({ loadingMentions: true });
        try {
            const res = await notificationAPI.getMentions();
            const list = Array.isArray(res?.data) ? res.data : [];
            const mentions = sortNotifications(list.map(normalizeNotification));
            const unreadMentionCount = mentions.filter((m) => !m.isRead).length;
            set({ mentions, unreadMentionCount });
        } catch (error) {
            console.error('Failed to fetch mentions:', error);
        } finally {
            set({ loadingMentions: false });
        }
    },

    refreshInbox: async () => {
        await Promise.all([get().fetchNotifications(), get().fetchInvites(), get().fetchMentions()]);
    },

    markNotificationRead: async (notificationId) => {
        const targetId = String(notificationId || '');
        if (!targetId) return;

        const previous = get().notifications;
        const previousMentions = get().mentions;
        const target =
            previous.find((notification) => String(notification?._id) === targetId) ||
            previousMentions.find((m) => String(m?._id) === targetId);
        if (!target || target.isRead) return;

        const updatedNotifications = previous.map((notification) =>
            String(notification?._id) === targetId
                ? { ...notification, isRead: true }
                : notification
        );
        const updatedMentions = previousMentions.map((m) =>
            String(m?._id) === targetId ? { ...m, isRead: true } : m
        );

        set({
            notifications: updatedNotifications,
            mentions: updatedMentions,
            unreadMentionCount: updatedMentions.filter((m) => !m.isRead).length,
        });

        try {
            await notificationAPI.markAsRead(targetId);
        } catch (error) {
            console.error('Failed to mark notification read:', error);
            set({ notifications: previous, mentions: previousMentions });
            throw error;
        }
    },

    markAllNotificationsRead: async () => {
        const previous = get().notifications;
        const previousMentions = get().mentions;
        const hasUnread =
            previous.some((notification) => !notification?.isRead) ||
            previousMentions.some((m) => !m?.isRead);
        if (!hasUnread) return;

        set({
            notifications: previous.map((notification) => ({ ...notification, isRead: true })),
            mentions: previousMentions.map((m) => ({ ...m, isRead: true })),
            unreadMentionCount: 0,
        });

        try {
            await notificationAPI.markAllAsRead();
        } catch (error) {
            console.error('Failed to mark all notifications read:', error);
            set({ notifications: previous, mentions: previousMentions });
            throw error;
        }
    },

    pushRealtimeNotification: (payload) => {
        const nextNotification = normalizeNotification(payload);

        set((state) => {
            const exists = state.notifications.some(
                (notification) => String(notification?._id) === String(nextNotification._id)
            );

            const updates = {};

            if (!exists) {
                updates.notifications = sortNotifications([nextNotification, ...state.notifications]);
            }

            // If this is a mention, also add to mentions list
            if (nextNotification.type === 'mention') {
                const mentionExists = state.mentions.some(
                    (m) => String(m?._id) === String(nextNotification._id)
                );
                if (!mentionExists) {
                    const nextMentions = sortNotifications([nextNotification, ...state.mentions]);
                    updates.mentions = nextMentions;
                    updates.unreadMentionCount = nextMentions.filter((m) => !m.isRead).length;
                }
            }

            return Object.keys(updates).length > 0 ? updates : {};
        });
    },

    removeInviteLocally: (inviteId) =>
        set((state) => ({
            invites: state.invites.filter((invite) => toInviteId(invite) !== String(inviteId || '')),
        })),

    acceptInvite: async (inviteId) => {
        const targetId = String(inviteId || '');
        if (!targetId) return { message: '' };

        const previous = get().invites;
        const exists = previous.some((invite) => toInviteId(invite) === targetId);
        if (!exists) return { message: '' };

        set({
            processingInviteId: targetId,
            invites: previous.filter((invite) => toInviteId(invite) !== targetId),
        });

        try {
            const res = await inviteAPI.acceptInvite(targetId);
            return { message: res?.data?.message || 'Invite accepted' };
        } catch (error) {
            set({ invites: previous });
            throw error;
        } finally {
            set((state) =>
                state.processingInviteId === targetId ? { processingInviteId: '' } : {}
            );
        }
    },

    declineInvite: async (inviteId) => {
        const targetId = String(inviteId || '');
        if (!targetId) return { message: '' };

        const previous = get().invites;
        const exists = previous.some((invite) => toInviteId(invite) === targetId);
        if (!exists) return { message: '' };

        set({
            processingInviteId: targetId,
            invites: previous.filter((invite) => toInviteId(invite) !== targetId),
        });

        try {
            const res = await inviteAPI.declineInvite(targetId);
            return { message: res?.data?.message || 'Invite declined' };
        } catch (error) {
            set({ invites: previous });
            throw error;
        } finally {
            set((state) =>
                state.processingInviteId === targetId ? { processingInviteId: '' } : {}
            );
        }
    },
}));

export default useInboxStore;
