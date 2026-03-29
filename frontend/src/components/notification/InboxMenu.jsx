import { useEffect, useMemo, useState } from 'react';
import {
    Inbox,
    UserPlus,
    MessageSquare,
    CircleCheckBig,
    AlertCircle,
    Info,
    Mail,
    Check,
    X,
    AtSign,
    Settings2,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import socket from '../../lib/socket';
import useAuthStore from '../../store/useAuthStore';
import useWorkspaceStore from '../../store/useWorkspaceStore';
import useInboxStore from '../../store/useInboxStore';
import { getRelativeTime } from '../../utils/dateUtils';

const TABS = {
    notifications: 'notifications',
    invites: 'invites',
    mentions: 'mentions',
};

const formatBadge = (count) => (count > 99 ? '99+' : count);

const getNotificationIcon = (type) => {
    const iconClass = 'w-4 h-4';

    switch (type) {
        case 'assignment':
            return <UserPlus className={`${iconClass} text-indigo-600`} />;
        case 'comment':
        case 'task_comment':
            return <MessageSquare className={`${iconClass} text-blue-600`} />;
        case 'mention':
            return <AtSign className={`${iconClass} text-purple-600`} />;
        case 'status':
        case 'task_status':
            return <CircleCheckBig className={`${iconClass} text-emerald-600`} />;
        case 'workspace_invite':
            return <Mail className={`${iconClass} text-cyan-600`} />;
        case 'alert':
            return <AlertCircle className={`${iconClass} text-amber-600`} />;
        default:
            return <Info className={`${iconClass} text-gray-600`} />;
    }
};

const getNotificationReference = (notification) => {
    switch (notification?.type) {
        case 'assignment':
            return 'Task assignment';
        case 'comment':
        case 'task_comment':
            return 'Task comment';
        case 'mention':
            return 'Mention';
        case 'status':
        case 'task_status':
            return 'Status update';
        case 'workspace_invite':
            return 'Workspace invite';
        case 'invite_accepted':
            return 'Invite accepted';
        case 'alert':
            return 'Alert';
        default:
            return 'Notification';
    }
};

const formatExpiry = (expiresAt) => {
    const timestamp = new Date(expiresAt).getTime();
    if (Number.isNaN(timestamp)) return '';

    const diff = timestamp - Date.now();
    if (diff <= 0) return 'Expired';

    const dayMs = 24 * 60 * 60 * 1000;
    const days = Math.ceil(diff / dayMs);
    return `Expires in ${days} day${days > 1 ? 's' : ''}`;
};

const InboxMenu = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState(TABS.notifications);

    const userInfo = useAuthStore((state) => state.userInfo);
    const currentWorkspaceId = useWorkspaceStore((state) => state.currentWorkspaceId);

    const notifications = useInboxStore((state) => state.notifications);
    const invites = useInboxStore((state) => state.invites);
    const mentions = useInboxStore((state) => state.mentions);
    const loadingNotifications = useInboxStore((state) => state.loadingNotifications);
    const loadingInvites = useInboxStore((state) => state.loadingInvites);
    const loadingMentions = useInboxStore((state) => state.loadingMentions);
    const processingInviteId = useInboxStore((state) => state.processingInviteId);
    const unreadMentionCount = useInboxStore((state) => state.unreadMentionCount);

    const fetchNotifications = useInboxStore((state) => state.fetchNotifications);
    const fetchInvites = useInboxStore((state) => state.fetchInvites);
    const refreshInbox = useInboxStore((state) => state.refreshInbox);
    const markNotificationRead = useInboxStore((state) => state.markNotificationRead);
    const markAllNotificationsRead = useInboxStore((state) => state.markAllNotificationsRead);
    const pushRealtimeNotification = useInboxStore((state) => state.pushRealtimeNotification);
    const acceptInvite = useInboxStore((state) => state.acceptInvite);
    const declineInvite = useInboxStore((state) => state.declineInvite);

    const unreadNotificationCount = useMemo(
        () => notifications.reduce((sum, notification) => sum + (notification?.isRead ? 0 : 1), 0),
        [notifications]
    );
    const pendingInviteCount = invites.length;
    const totalBadgeCount =
        unreadNotificationCount + pendingInviteCount + (Number(unreadMentionCount) || 0);

    useEffect(() => {
        if (!userInfo?._id) return;
        refreshInbox();
    }, [refreshInbox, userInfo?._id]);

    useEffect(() => {
        if (!userInfo?._id) return;
        const joinUserRoom = () => socket.emit('join_workspace', `user_${userInfo._id}`);
        joinUserRoom();
        socket.on('connect', joinUserRoom);
        return () => socket.off('connect', joinUserRoom);
    }, [userInfo?._id]);

    useEffect(() => {
        if (!currentWorkspaceId) return;
        const joinWorkspaceRoom = () => socket.emit('join_workspace', `workspace_${currentWorkspaceId}`);
        joinWorkspaceRoom();
        socket.on('connect', joinWorkspaceRoom);
        return () => socket.off('connect', joinWorkspaceRoom);
    }, [currentWorkspaceId]);

    useEffect(() => {
        const handleNewNotification = (notification) => {
            const recipient = String(notification?.recipient || '');
            if (recipient && recipient !== String(userInfo?._id || '')) return;

            pushRealtimeNotification(notification);
            if (notification?.type === 'workspace_invite') {
                fetchInvites();
            }
        };

        socket.on('new_notification', handleNewNotification);
        return () => socket.off('new_notification', handleNewNotification);
    }, [fetchInvites, pushRealtimeNotification, userInfo?._id]);

    const handleMarkRead = async (event, notificationId) => {
        event.stopPropagation();
        try {
            await markNotificationRead(notificationId);
        } catch {
            toast.error('Failed to mark notification as read');
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await markAllNotificationsRead();
        } catch {
            toast.error('Failed to mark all as read');
        }
    };

    const handleAcceptInvite = async (inviteId) => {
        try {
            const result = await acceptInvite(inviteId);
            toast.success(result?.message || 'Invite accepted');
            fetchNotifications();
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Failed to accept invite');
        }
    };

    const handleDeclineInvite = async (inviteId) => {
        try {
            const result = await declineInvite(inviteId);
            toast.success(result?.message || 'Invite declined');
            fetchNotifications();
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Failed to decline invite');
        }
    };

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen((value) => !value)}
                className="relative p-2 rounded-lg text-gray-300 hover:text-white hover:bg-gray-800/70 transition-colors"
                aria-label="Open inbox"
                title="Inbox"
            >
                <Inbox className="w-5 h-5" />
                {totalBadgeCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-red-500 text-white text-[10px] font-semibold flex items-center justify-center">
                        {formatBadge(totalBadgeCount)}
                    </span>
                )}
            </button>

            {isOpen && (
                <>
                    <div className="absolute right-0 mt-2 w-105 max-w-[calc(100vw-1rem)] bg-white border border-gray-200 rounded-2xl shadow-2xl z-50 overflow-hidden">
                        <div className="max-h-[70vh] flex flex-col">
                            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                                <h3 className="text-sm font-bold text-gray-900">Inbox</h3>
                                <div className="flex items-center gap-2">
                                    {activeTab === TABS.notifications && unreadNotificationCount > 0 && (
                                        <button
                                            onClick={handleMarkAllRead}
                                            className="text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
                                        >
                                            Mark all read
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        className="w-7 h-7 rounded-md border border-gray-200 text-gray-400 flex items-center justify-center cursor-not-allowed"
                                        aria-label="Inbox settings"
                                        title="Settings coming soon"
                                        disabled
                                    >
                                        <Settings2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <div className="px-3 py-2 border-b border-gray-100">
                                <div className="grid grid-cols-3 gap-1">
                                    <button
                                        onClick={() => setActiveTab(TABS.notifications)}
                                        className={`px-2.5 py-2 rounded-lg text-xs font-semibold transition ${
                                            activeTab === TABS.notifications
                                                ? 'bg-blue-50 text-blue-700'
                                                : 'text-gray-600 hover:bg-gray-100'
                                        }`}
                                    >
                                        Notifications ({unreadNotificationCount})
                                    </button>
                                    <button
                                        onClick={() => setActiveTab(TABS.invites)}
                                        className={`px-2.5 py-2 rounded-lg text-xs font-semibold transition ${
                                            activeTab === TABS.invites
                                                ? 'bg-blue-50 text-blue-700'
                                                : 'text-gray-600 hover:bg-gray-100'
                                        }`}
                                    >
                                        Invites ({pendingInviteCount})
                                    </button>
                                    <button
                                        onClick={() => setActiveTab(TABS.mentions)}
                                        className={`px-2.5 py-2 rounded-lg text-xs font-semibold transition ${
                                            activeTab === TABS.mentions
                                                ? 'bg-blue-50 text-blue-700'
                                                : 'text-gray-600 hover:bg-gray-100'
                                        }`}
                                    >
                                        Mentions ({unreadMentionCount})
                                    </button>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto">
                                {activeTab === TABS.notifications && (
                                    <div>
                                        {loadingNotifications && notifications.length === 0 ? (
                                            <div className="py-10 flex justify-center">
                                                <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                            </div>
                                        ) : notifications.length === 0 ? (
                                            <p className="p-6 text-center text-sm text-gray-400">No notifications</p>
                                        ) : (
                                            notifications.map((notification) => (
                                                <div
                                                    key={notification._id}
                                                    onClick={() => {
                                                        if (!notification?.isRead) {
                                                            markNotificationRead(notification?._id);
                                                        }
                                                    }}
                                                    className={`w-full text-left p-3 border-b border-gray-100 hover:bg-gray-50 transition cursor-pointer ${
                                                        notification?.isRead ? 'bg-white' : 'bg-blue-50/40'
                                                    }`}
                                                >
                                                    <div className="flex items-start gap-3">
                                                        <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                                                            {getNotificationIcon(notification?.type)}
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <p className="text-sm text-gray-800 wrap-break-word">
                                                                {notification?.sender?.fullname ? (
                                                                    <span className="font-semibold mr-1">
                                                                        {notification.sender.fullname}
                                                                    </span>
                                                                ) : null}
                                                                {notification?.message}
                                                            </p>
                                                            <div className="mt-1 text-[11px] text-gray-500 flex items-center gap-1.5">
                                                                <span>{getNotificationReference(notification)}</span>
                                                                <span>|</span>
                                                                <span>{getRelativeTime(notification?.createdAt)}</span>
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-col items-end gap-1 shrink-0">
                                                            {!notification?.isRead && (
                                                                <span className="w-2 h-2 rounded-full bg-blue-500 mt-1"></span>
                                                            )}
                                                            {!notification?.isRead && (
                                                                <button
                                                                    type="button"
                                                                    onClick={(event) =>
                                                                        handleMarkRead(event, notification?._id)
                                                                    }
                                                                    className="text-[11px] text-blue-600 hover:text-blue-700 font-medium"
                                                                >
                                                                    Mark read
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                )}

                                {activeTab === TABS.invites && (
                                    <div>
                                        {loadingInvites && invites.length === 0 ? (
                                            <div className="py-10 flex justify-center">
                                                <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                            </div>
                                        ) : invites.length === 0 ? (
                                            <p className="p-6 text-center text-sm text-gray-400">No pending invites</p>
                                        ) : (
                                            invites.map((invite) => (
                                                <div key={invite._id} className="p-3 border-b border-gray-100">
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div className="min-w-0">
                                                            <p className="text-sm font-semibold text-gray-800 truncate">
                                                                {invite?.workspace?.name || 'Workspace'}
                                                            </p>
                                                            <p className="text-xs text-gray-500 mt-0.5">
                                                                Invited by {invite?.invitedBy?.fullname || 'Unknown'}
                                                            </p>
                                                            <p className="text-xs text-gray-500 mt-0.5">
                                                                Role: <span className="capitalize">{invite?.role || 'member'}</span>
                                                            </p>
                                                            <p className="text-xs text-amber-600 mt-0.5">
                                                                {formatExpiry(invite?.expiresAt)}
                                                            </p>
                                                        </div>
                                                        <div className="flex items-center gap-1.5 shrink-0">
                                                            <button
                                                                onClick={() => handleAcceptInvite(invite?._id)}
                                                                disabled={processingInviteId === invite?._id}
                                                                className="px-2 py-1.5 rounded-md bg-green-600 text-white text-xs font-semibold hover:bg-green-700 disabled:opacity-50"
                                                            >
                                                                <span className="inline-flex items-center gap-1">
                                                                    <Check className="w-3.5 h-3.5" />
                                                                    Accept
                                                                </span>
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeclineInvite(invite?._id)}
                                                                disabled={processingInviteId === invite?._id}
                                                                className="px-2 py-1.5 rounded-md border border-gray-200 text-gray-700 text-xs font-semibold hover:bg-gray-50 disabled:opacity-50"
                                                            >
                                                                <span className="inline-flex items-center gap-1">
                                                                    <X className="w-3.5 h-3.5" />
                                                                    Decline
                                                                </span>
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                )}

                                {activeTab === TABS.mentions && (
                                    <div>
                                        {loadingMentions && mentions.length === 0 ? (
                                            <div className="py-10 flex justify-center">
                                                <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                                            </div>
                                        ) : mentions.length === 0 ? (
                                            <div className="p-6 text-center text-sm text-gray-400">
                                                <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 mb-3">
                                                    <AtSign className="w-5 h-5 text-gray-400" />
                                                </div>
                                                <p>No mentions yet</p>
                                                <p className="text-xs text-gray-400 mt-1">When someone @mentions you in a comment, it will appear here.</p>
                                            </div>
                                        ) : (
                                            mentions.map((mention) => (
                                                <div
                                                    key={mention._id}
                                                    onClick={() => {
                                                        if (!mention?.isRead) {
                                                            markNotificationRead(mention?._id);
                                                        }
                                                    }}
                                                    className={`w-full text-left p-3 border-b border-gray-100 hover:bg-gray-50 transition cursor-pointer ${
                                                        mention?.isRead ? 'bg-white' : 'bg-purple-50/40'
                                                    }`}
                                                >
                                                    <div className="flex items-start gap-3">
                                                        <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center shrink-0">
                                                            <AtSign className="w-4 h-4 text-purple-600" />
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <p className="text-sm text-gray-800 wrap-break-word">
                                                                {mention?.sender?.fullname ? (
                                                                    <span className="font-semibold mr-1">
                                                                        {mention.sender.fullname}
                                                                    </span>
                                                                ) : null}
                                                                {mention?.taskTitle
                                                                    ? `mentioned you in "${mention.taskTitle}"`
                                                                    : mention?.message}
                                                            </p>
                                                            <div className="mt-1 text-[11px] text-gray-500 flex items-center gap-1.5">
                                                                <span>Mention</span>
                                                                <span>|</span>
                                                                <span>{getRelativeTime(mention?.createdAt)}</span>
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-col items-end gap-1 shrink-0">
                                                            {!mention?.isRead && (
                                                                <span className="w-2 h-2 rounded-full bg-purple-500 mt-1"></span>
                                                            )}
                                                            {!mention?.isRead && (
                                                                <button
                                                                    type="button"
                                                                    onClick={(event) =>
                                                                        handleMarkRead(event, mention?._id)
                                                                    }
                                                                    className="text-[11px] text-purple-600 hover:text-purple-700 font-medium"
                                                                >
                                                                    Mark read
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() => setIsOpen(false)}
                        className="fixed inset-0 z-40"
                        aria-label="Close inbox"
                    />
                </>
            )}
        </div>
    );
};

export default InboxMenu;
