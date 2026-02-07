import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {
    Plus,
    Pencil,
    Trash2,
    Search,
    Hash,
    Phone,
    Video,
    Settings,
    Users as UsersIcon,
    X,
} from 'lucide-react';
import useWorkspaceStore from '../store/useWorkspaceStore';
import useAuthStore from '../store/useAuthStore';
import ChatArea from '../components/chat/ChatArea';
import ConfirmModal from '../components/modals/ConfirmModal';

const WorkspaceChat = () => {
    const { currentWorkspaceId, selectedWorkspace, setSelectedWorkspace } = useWorkspaceStore();
    const { userInfo } = useAuthStore();
    const [channels, setChannels] = useState([]);
    const [dmThreads, setDmThreads] = useState([]);
    const [selectedChannel, setSelectedChannel] = useState(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showChannelMenu, setShowChannelMenu] = useState(false);
    const [showDmPicker, setShowDmPicker] = useState(false);
    const [dmSearch, setDmSearch] = useState('');
    const [channelToDelete, setChannelToDelete] = useState(null);
    const [deletingChannel, setDeletingChannel] = useState(false);

    const loadConversations = async (preferred) => {
        if (!currentWorkspaceId) return;
        setLoading(true);
        try {
            const [wsRes, chRes, dmRes] = await Promise.all([
                axios.get(`/api/workspaces/${currentWorkspaceId}`),
                axios.get(`/api/channels/workspace/${currentWorkspaceId}`),
                axios.get(`/api/channels/workspace/${currentWorkspaceId}/dms`),
            ]);
            setSelectedWorkspace(wsRes.data);
            const nextChannels = chRes.data || [];
            const nextDms = dmRes.data || [];
            setChannels(nextChannels);
            setDmThreads(nextDms);

            setSelectedChannel((prev) => {
                const combined = [...nextChannels, ...nextDms];
                const preferredId = preferred?._id;
                if (preferredId) {
                    const match = combined.find((c) => c._id === preferredId);
                    if (match) return match;
                }
                if (prev) {
                    const match = combined.find((c) => c._id === prev._id);
                    if (match) return match;
                }
                return nextChannels[0] || nextDms[0] || null;
            });
        } catch (err) {
            console.error('Failed to load channels', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadConversations();
    }, [currentWorkspaceId]);

    const refreshChannels = async () => {
        if (!currentWorkspaceId) return;
        const [chRes, dmRes] = await Promise.all([
            axios.get(`/api/channels/workspace/${currentWorkspaceId}`),
            axios.get(`/api/channels/workspace/${currentWorkspaceId}/dms`),
        ]);
        const nextChannels = chRes.data || [];
        const nextDms = dmRes.data || [];
        setChannels(nextChannels);
        setDmThreads(nextDms);
        setSelectedChannel((prev) => {
            const combined = [...nextChannels, ...nextDms];
            const match = prev && combined.find((c) => c._id === prev._id);
            return match || nextChannels[0] || nextDms[0] || null;
        });
        if (selectedWorkspace) {
            setSelectedWorkspace({ ...selectedWorkspace, channels: nextChannels });
        }
    };

    const workspace = selectedWorkspace?.workspace;
    const workspaceName = workspace?.name || 'Workspace';
    const members = workspace?.members || [];
    const memberCount = members.length;

    const memberLookup = useMemo(() => {
        const map = {};
        members.forEach((m) => {
            if (m?.user?._id) {
                map[m.user._id] = m.user;
            }
        });
        return map;
    }, [members]);

    const myRole = members.find((m) => m.user?._id === userInfo?._id)?.role;
    const canManageChannels = myRole === 'owner' || myRole === 'admin';

    const handleCreateChannel = async () => {
        const name = prompt('Channel name');
        if (!name) return;
        try {
            await axios.post('/api/channels', { workspaceId: currentWorkspaceId, name });
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

    const handleDeleteChannel = async () => {
        if (!selectedChannel) return;
        setChannelToDelete(selectedChannel);
        setShowChannelMenu(false);
    };

    const confirmDeleteChannel = async () => {
        if (!channelToDelete) return;
        setDeletingChannel(true);
        try {
            await axios.delete(`/api/channels/${channelToDelete._id}`);
            setChannelToDelete(null);
            refreshChannels();
        } catch (err) {
            console.error('Failed to delete channel', err);
        } finally {
            setDeletingChannel(false);
        }
    };

    const handleCreateDM = async (memberId) => {
        try {
            const res = await axios.post('/api/channels/dm', {
                workspaceId: currentWorkspaceId,
                memberId,
            });
            setShowDmPicker(false);
            setDmSearch('');
            await loadConversations(res.data);
        } catch (err) {
            console.error('Failed to create DM', err);
        }
    };

    const filteredChannels = useMemo(() => {
        const term = search.trim().toLowerCase();
        if (!term) return channels;
        return channels.filter((ch) => ch.name.toLowerCase().includes(term));
    }, [channels, search]);

    const dmWithMeta = useMemo(() => {
        return dmThreads.map((dm) => {
            const membersList = dm.members || [];
            const other = membersList.find((m) => {
                const id = m?._id || m;
                return id && id.toString() !== userInfo?._id;
            });
            const otherUser = other?._id ? other : memberLookup[other] || null;
            return {
                ...dm,
                type: 'dm',
                displayName: otherUser?.fullname || 'Direct Message',
                displayEmail: otherUser?.email || '',
                displayAvatar: otherUser?.avatar || '',
            };
        });
    }, [dmThreads, memberLookup, userInfo]);

    const filteredDMs = useMemo(() => {
        const term = search.trim().toLowerCase();
        if (!term) return dmWithMeta;
        return dmWithMeta.filter((dm) => {
            const name = dm.displayName?.toLowerCase() || '';
            const email = dm.displayEmail?.toLowerCase() || '';
            return name.includes(term) || email.includes(term);
        });
    }, [dmWithMeta, search]);

    const dmOptions = useMemo(() => {
        const term = dmSearch.trim().toLowerCase();
        return members
            .map((m) => m.user)
            .filter((u) => u && u._id !== userInfo?._id)
            .filter((u) => {
                if (!term) return true;
                return (
                    u.fullname?.toLowerCase().includes(term) ||
                    u.email?.toLowerCase().includes(term)
                );
            });
    }, [members, userInfo, dmSearch]);

    const selectedConversation = useMemo(() => {
        if (!selectedChannel) return null;
        if (selectedChannel.type === 'dm') {
            return dmWithMeta.find((dm) => dm._id === selectedChannel._id) || selectedChannel;
        }
        return selectedChannel;
    }, [selectedChannel, dmWithMeta]);

    const selectedIsDM = selectedConversation?.type === 'dm';
    const selectedDmName = selectedConversation?.displayName || 'Direct Message';
    const selectedDmEmail = selectedConversation?.displayEmail || '';
    const canManageSelectedChannel = canManageChannels && !selectedIsDM;

    if (!currentWorkspaceId) {
        return (
            <div className="px-8 py-10">
                <div className="text-center text-gray-500">Select a workspace to open chat.</div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="px-8 py-10">
                <div className="text-gray-500">Loading chat...</div>
            </div>
        );
    }

    return (
        <div className="h-[calc(100vh-64px)]">
            <div className="h-full flex overflow-hidden">
                {/* Left Sidebar */}
                <aside className="w-72 border-r bg-gray-50/80 p-4 flex flex-col">
                    <div className="relative mb-4">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search conversations..."
                            className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                        />
                    </div>

                    <div className="flex-1 overflow-y-auto pr-1 space-y-4">
                        <div>
                            <div className="flex items-center justify-between text-[11px] uppercase tracking-wider text-gray-500 mb-2">
                                <span>Channels</span>
                                {canManageChannels && (
                                    <button
                                        onClick={handleCreateChannel}
                                        className="text-indigo-600 hover:text-indigo-700"
                                        title="Create channel"
                                    >
                                        <Plus size={14} />
                                    </button>
                                )}
                            </div>
                            <div className="space-y-1">
                                {filteredChannels.length === 0 && (
                                    <div className="text-xs text-gray-500 px-2 py-2">No channels found.</div>
                                )}
                                {filteredChannels.map((ch) => {
                                    const isActive = selectedChannel?._id === ch._id;
                                    return (
                                        <button
                                            key={ch._id}
                                            onClick={() => {
                                                setSelectedChannel({ ...ch, type: ch.type || 'channel' });
                                                setShowChannelMenu(false);
                                            }}
                                            className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2 border-l-4 transition ${
                                                isActive
                                                    ? 'bg-indigo-50 text-indigo-700 border-indigo-500'
                                                    : 'text-gray-700 border-transparent hover:bg-white'
                                            }`}
                                        >
                                            <Hash size={14} className={isActive ? 'text-indigo-600' : 'text-gray-400'} />
                                            <span className="truncate">{ch.name}</span>
                                            {ch.isGeneral && (
                                                <span className="ml-auto text-[10px] text-gray-400">default</span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center justify-between text-[11px] uppercase tracking-wider text-gray-500 mb-2">
                                <span>Direct Messages</span>
                                <button
                                    onClick={() => setShowDmPicker(true)}
                                    className="text-indigo-600 hover:text-indigo-700"
                                    title="Start a DM"
                                >
                                    <Plus size={14} />
                                </button>
                            </div>
                            <div className="space-y-1">
                                {filteredDMs.length === 0 && (
                                    <div className="text-xs text-gray-500 px-2 py-2">No direct messages yet.</div>
                                )}
                                {filteredDMs.map((dm) => {
                                    const isActive = selectedChannel?._id === dm._id;
                                    return (
                                        <button
                                            key={dm._id}
                                            type="button"
                                            onClick={() => {
                                                setSelectedChannel(dm);
                                                setShowChannelMenu(false);
                                            }}
                                            className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2 border-l-4 transition ${
                                                isActive
                                                    ? 'bg-indigo-50 text-indigo-700 border-indigo-500'
                                                    : 'text-gray-700 border-transparent hover:bg-white'
                                            }`}
                                        >
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 text-white flex items-center justify-center text-xs font-semibold">
                                                {dm.displayName?.substring(0, 1).toUpperCase() || 'U'}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="text-sm font-medium truncate">{dm.displayName}</div>
                                                <div className="text-[11px] text-gray-400 truncate">{dm.displayEmail}</div>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </aside>

                {/* Main Chat */}
                <main className="flex-1 flex flex-col">
                    {selectedConversation ? (
                        <>
                            <div className="flex items-center justify-between px-5 py-3 border-b bg-white">
                                <div className="flex items-center gap-3">
                                    {selectedIsDM ? (
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 text-white flex items-center justify-center text-xs font-semibold">
                                            {selectedDmName?.substring(0, 1).toUpperCase() || 'U'}
                                        </div>
                                    ) : (
                                        <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                                            <Hash size={18} />
                                        </div>
                                    )}
                                    <div>
                                        <div className="text-xs text-gray-400">{workspaceName}</div>
                                        <div className="text-sm font-semibold text-gray-900">
                                            {selectedIsDM ? selectedDmName : `# ${selectedConversation.name}`}
                                        </div>
                                        <div className="text-[11px] text-gray-500 flex items-center gap-2">
                                            {selectedIsDM ? (
                                                <span>{selectedDmEmail || 'Direct message'}</span>
                                            ) : (
                                                <>
                                                    <UsersIcon size={12} /> {memberCount} members
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:text-indigo-600 hover:border-indigo-200">
                                        <Phone size={16} />
                                    </button>
                                    <button className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:text-indigo-600 hover:border-indigo-200">
                                        <Video size={16} />
                                    </button>
                                    <div className="relative">
                                        <button
                                            onClick={() => setShowChannelMenu((v) => !v)}
                                            disabled={!canManageSelectedChannel}
                                            title={canManageSelectedChannel ? 'Channel settings' : 'Only admins can manage channels'}
                                            className={`w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center ${
                                                canManageSelectedChannel
                                                    ? 'text-gray-500 hover:text-indigo-600 hover:border-indigo-200'
                                                    : 'text-gray-300 bg-gray-50 cursor-not-allowed'
                                            }`}
                                        >
                                            <Settings size={16} />
                                        </button>
                                        {showChannelMenu && canManageSelectedChannel && !selectedConversation.isGeneral && (
                                            <div className="absolute right-0 mt-2 w-44 rounded-lg border border-gray-200 bg-white shadow-lg z-20">
                                                <button
                                                    onClick={handleRenameChannel}
                                                    className="w-full px-3 py-2 text-left text-xs text-gray-700 hover:bg-gray-50"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <Pencil size={14} /> Rename channel
                                                    </div>
                                                </button>
                                                <button
                                                    onClick={handleDeleteChannel}
                                                    className="w-full px-3 py-2 text-left text-xs text-red-600 hover:bg-red-50"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <Trash2 size={14} /> Delete channel
                                                    </div>
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1">
                                <ChatArea
                                    channel={selectedConversation}
                                    workspaceId={currentWorkspaceId}
                                    canModerate={canManageSelectedChannel}
                                    showHeader={false}
                                    displayName={selectedIsDM ? selectedDmName : selectedConversation.name}
                                    isDM={selectedIsDM}
                                />
                            </div>
                        </>
                    ) : (
                        <div className="h-full flex items-center justify-center text-gray-500">
                            <div className="text-center">
                                <div className="text-lg font-semibold text-gray-700">Select a channel to start chatting</div>
                                <div className="text-sm text-gray-400 mt-1">Your conversations will appear here.</div>
                            </div>
                        </div>
                    )}
                </main>
            </div>

            {showDmPicker && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-5">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">Start a Direct Message</h3>
                                <p className="text-xs text-gray-500">Choose a member to chat with.</p>
                            </div>
                            <button
                                onClick={() => setShowDmPicker(false)}
                                className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-600"
                            >
                                <X size={16} />
                            </button>
                        </div>
                        <div className="relative mb-3">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                value={dmSearch}
                                onChange={(e) => setDmSearch(e.target.value)}
                                placeholder="Search members"
                                className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                            />
                        </div>
                        <div className="max-h-64 overflow-y-auto divide-y divide-gray-100">
                            {dmOptions.length === 0 && (
                                <div className="text-sm text-gray-400 py-4 text-center">No members found.</div>
                            )}
                            {dmOptions.map((user) => (
                                <button
                                    key={user._id}
                                    onClick={() => handleCreateDM(user._id)}
                                    className="w-full flex items-center gap-3 px-3 py-3 text-left hover:bg-gray-50"
                                >
                                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 text-white flex items-center justify-center text-xs font-semibold">
                                        {user.fullname?.substring(0, 1).toUpperCase() || 'U'}
                                    </div>
                                    <div>
                                        <div className="text-sm font-medium text-gray-800">{user.fullname}</div>
                                        <div className="text-xs text-gray-400">{user.email}</div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <ConfirmModal
                isOpen={!!channelToDelete}
                title="Delete Channel"
                message={`Delete #${channelToDelete?.name || ''}? This will remove all messages.`}
                confirmText="Delete"
                cancelText="Cancel"
                variant="danger"
                loading={deletingChannel}
                onClose={() => !deletingChannel && setChannelToDelete(null)}
                onConfirm={confirmDeleteChannel}
            />
        </div>
    );
};

export default WorkspaceChat;
