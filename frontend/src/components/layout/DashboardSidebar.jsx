import { useCallback, useEffect, useMemo } from 'react';
import { ChevronsLeft, ChevronsRight } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import WorkspaceSelector from './WorkspaceSelector';
import NavigationGroup from './NavigationGroup';
import { NAV_GROUPS, SYSTEM_ITEMS, filterNavByRole, filterSystemByRole } from '../../utils/navigationConfig';
import logo from '../../assets/logo.png';
import socket from '../../lib/socket';
import useChatUnreadStore from '../../store/useChatUnreadStore';
import { WORKSPACE_PLAN, WORKSPACE_PLAN_FEATURES, normalizeWorkspacePlan } from '../../constants/workspacePlans';
import { showUpgradeToProPrompt } from '../../utils/upgradePrompts';

const DashboardSidebar = ({
    isCollapsed,
    onToggleCollapse,
    workspaceProps,
    userInfo,
    myRole,
}) => {
    const navigate = useNavigate();
    const location = useLocation();
    const iconSize = 22;
    const currentWorkspaceId = workspaceProps?.currentWorkspaceId;
    const selectedWorkspace = workspaceProps?.selectedWorkspace;
    const workspace = selectedWorkspace?.workspace;
    const currentPlan = normalizeWorkspacePlan(workspace?.settings?.billing?.currentPlan);
    const planFeatures = WORKSPACE_PLAN_FEATURES[currentPlan] || WORKSPACE_PLAN_FEATURES[WORKSPACE_PLAN.FREE];
    const analyticsLocked = !planFeatures.analyticsEnabled;
    const setWorkspaceChannels = useChatUnreadStore((state) => state.setWorkspaceChannels);
    const incrementUnread = useChatUnreadStore((state) => state.incrementUnread);
    const isWorkspaceChannel = useChatUnreadStore((state) => state.isWorkspaceChannel);
    const unreadByWorkspace = useChatUnreadStore((state) => state.unreadByWorkspace);
    const activeChannelByWorkspace = useChatUnreadStore((state) => state.activeChannelByWorkspace);

    const totalChatUnread = useMemo(() => {
        const wid = String(currentWorkspaceId || '');
        if (!wid) return 0;
        const unreadMap = unreadByWorkspace[wid] || {};
        return Object.values(unreadMap).reduce((sum, value) => sum + (Number(value) || 0), 0);
    }, [currentWorkspaceId, unreadByWorkspace]);

    const handleAnalyticsLockedClick = useCallback(() => {
        showUpgradeToProPrompt({
            message: 'Analytics is available only for Pro workspaces.',
            onUpgrade: () => navigate('/settings'),
            ctaLabel: 'Upgrade in Billing',
        });
    }, [navigate]);

    const navGroups = useMemo(
        () =>
            filterNavByRole(NAV_GROUPS, myRole).map((group) => ({
                ...group,
                items: group.items.map((item) =>
                    item.to === '/chat'
                        ? { ...item, badgeCount: totalChatUnread }
                        : item.to === '/analytics' && analyticsLocked
                            ? { ...item, locked: true, onLockedClick: handleAnalyticsLockedClick }
                            : item
                ),
            })),
        [totalChatUnread, myRole, analyticsLocked, handleAnalyticsLockedClick]
    );

    const systemItems = useMemo(
        () => filterSystemByRole(SYSTEM_ITEMS, myRole),
        [myRole]
    );

    const avatarSrc = userInfo?.avatar;
    const avatarInitial = userInfo?.fullname?.[0]?.toUpperCase() || 'U';

    useEffect(() => {
        if (!currentWorkspaceId) return;

        const loadDmChannels = async () => {
            try {
                const [chRes, dmRes] = await Promise.all([
                    axios.get(`/api/channels/workspace/${currentWorkspaceId}`),
                    axios.get(`/api/channels/workspace/${currentWorkspaceId}/dms`),
                ]);
                const channels = chRes.data || [];
                const dms = dmRes.data || [];
                const allChannels = [...channels, ...dms];
                setWorkspaceChannels(currentWorkspaceId, allChannels);

                socket.emit('join_workspace', `workspace_${currentWorkspaceId}`);
                allChannels.forEach((channel) => {
                    const channelId = channel?._id;
                    if (!channelId) return;
                    socket.emit('join_channel', channelId);
                });
            } catch (err) {
                console.error('Failed to load channels for unread counts', err);
            }
        };

        loadDmChannels();
    }, [currentWorkspaceId, setWorkspaceChannels]);

    useEffect(() => {
        if (!currentWorkspaceId || !userInfo?._id) return;

        const handleReceiveMessage = (msg) => {
            const messageWorkspaceId = String(msg?.workspaceId || '');
            const channelId = String(msg?.channelId?._id || msg?.channelId || '');
            const senderId = String(msg?.sender?._id || msg?.sender || '');
            if (!messageWorkspaceId || !channelId || !senderId) return;
            if (senderId === String(userInfo._id)) return;
            if (messageWorkspaceId !== String(currentWorkspaceId)) return;
            if (!isWorkspaceChannel(messageWorkspaceId, channelId)) return;

            const isChatPage = location.pathname === '/chat';
            const activeChannelId = String(activeChannelByWorkspace[messageWorkspaceId] || '');
            if (isChatPage && activeChannelId && activeChannelId === channelId) return;

            incrementUnread({ workspaceId: messageWorkspaceId, channelId });
        };

        socket.on('receive_message', handleReceiveMessage);
        return () => socket.off('receive_message', handleReceiveMessage);
    }, [currentWorkspaceId, userInfo?._id, incrementUnread, isWorkspaceChannel, location.pathname, activeChannelByWorkspace]);

    return (
        <aside
            className={`${
                isCollapsed ? 'w-18' : 'w-62'
            } bg-linear-to-b from-gray-950 to-gray-900 text-white flex flex-col shadow-xl transition-all duration-200 ease-out overflow-hidden shrink-0`}
        >
            {/* Header */}
            <div className="h-16 flex items-center justify-between px-4 border-b border-gray-800/70">
                <div className="flex items-center gap-2 font-bold text-xl">
                    <img src={logo} alt="TaskMate" className="w-10 h-10 rounded-lg object-contain" />
                    <span
                        className={`transition-all duration-200 ease-out ${
                            isCollapsed ? 'opacity-0 -translate-x-2 pointer-events-none w-0' : 'opacity-100 translate-x-0'
                        }`}
                    >
                        TaskMate
                    </span>
                </div>
                <button
                    onClick={onToggleCollapse}
                    className="w-10 h-10 rounded-md flex items-center justify-center text-gray-300 hover:text-white hover:bg-gray-800/70 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                    aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                    title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                >
                    {isCollapsed ? <ChevronsRight size={20} /> : <ChevronsLeft size={20} />}
                </button>
            </div>

            {/* Workspace Selector */}
            <WorkspaceSelector {...workspaceProps} isCollapsed={isCollapsed} />

            {/* Navigation Groups */}
            <nav className={`flex-1 py-6 text-base ${isCollapsed ? 'px-2 space-y-2' : 'px-3 space-y-5'} overflow-hidden`}>
                {navGroups.map((group, index) => (
                    <NavigationGroup
                        key={group.label}
                        group={group}
                        isCollapsed={isCollapsed}
                        iconSize={iconSize}
                        showDivider={index > 0}
                    />
                ))}
            </nav>

            {/* System Items */}
            {systemItems.length > 0 && (
            <div className={`border-t border-gray-800/60 py-3 text-base ${isCollapsed ? 'px-2 space-y-2' : 'px-3 space-y-2'}`}>
                {!isCollapsed && (
                    <div className="px-3 text-xs uppercase tracking-wider text-gray-500">
                        System
                    </div>
                )}
                <NavigationGroup
                    group={{ items: systemItems }}
                    isCollapsed={isCollapsed}
                    iconSize={iconSize}
                />
            </div>
            )}

            {/* User Profile Section */}
            <div className="border-t border-gray-800/60 p-2.5">
                {isCollapsed ? (
                    <button
                        onClick={() => navigate('/profile')}
                        className="w-full flex items-center justify-center p-2.5 rounded-lg hover:bg-gray-800/70 transition-colors group"
                        title={userInfo?.fullname || 'Profile'}
                    >
                        {avatarSrc ? (
                            <img
                                src={avatarSrc}
                                alt="Profile"
                                className="w-10 h-10 rounded-full object-cover border-2 border-gray-700 group-hover:border-blue-500 transition-colors"
                            />
                        ) : (
                            <div className="w-10 h-10 rounded-full bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold border-2 border-gray-700 group-hover:border-blue-500 transition-colors">
                                {avatarInitial}
                            </div>
                        )}
                    </button>
                ) : (
                    <button
                        onClick={() => navigate('/profile')}
                        className="w-full flex items-center gap-3 px-3 py-1.5 rounded-lg hover:bg-gray-800/70 transition-colors group"
                    >
                        {avatarSrc ? (
                            <img
                                src={avatarSrc}
                                alt="Profile"
                                className="w-9 h-9 rounded-full object-cover border-2 border-gray-700 group-hover:border-blue-500 transition-colors shrink-0"
                            />
                        ) : (
                            <div className="w-9 h-9 rounded-full bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold border-2 border-gray-700 group-hover:border-blue-500 transition-colors shrink-0">
                                {avatarInitial}
                            </div>
                        )}
                        <span className="text-base font-semibold text-white truncate">{userInfo?.fullname || 'User'}</span>
                    </button>
                )}
            </div>
        </aside>
    );
};

export default DashboardSidebar;
