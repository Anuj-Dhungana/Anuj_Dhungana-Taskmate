import { useEffect, useState } from 'react';
import axios from 'axios';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import useWorkspaceStore from '../store/userWorkspaceStore';
import useAuthStore from '../store/useAuthStore';
import ChatArea from '../components/Chat/ChatArea';

const WorkspaceChat = () => {
    const { currentWorkspaceId, selectedWorkspace, setSelectedWorkspace } = useWorkspaceStore();
    const { userInfo } = useAuthStore();
    const [channels, setChannels] = useState([]);
    const [selectedChannel, setSelectedChannel] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadWorkspace = async () => {
            if (!currentWorkspaceId) return;
            setLoading(true);
            setChannels([]);
            setSelectedChannel(null);
            try {
                const [wsRes, chRes] = await Promise.all([
                    axios.get(`/api/workspaces/${currentWorkspaceId}`),
                    axios.get(`/api/channels/workspace/${currentWorkspaceId}`)
                ]);
                setSelectedWorkspace(wsRes.data);
                setChannels(chRes.data || []);
                if (chRes.data?.length) {
                    setSelectedChannel((prev) => {
                        const stillExists = prev && chRes.data.find((c) => c._id === prev._id);
                        return stillExists || chRes.data[0];
                    });
                }
            } catch (err) {
                console.error('Failed to load channels', err);
            } finally {
                setLoading(false);
            }
        };
        loadWorkspace();
    }, [currentWorkspaceId]);

    const refreshChannels = async () => {
        if (!currentWorkspaceId) return;
        const res = await axios.get(`/api/channels/workspace/${currentWorkspaceId}`);
        setChannels(res.data || []);
        if (selectedWorkspace) {
            setSelectedWorkspace({ ...selectedWorkspace, channels: res.data || [] });
        }
        if (res.data?.length) {
            setSelectedChannel((prev) => {
                const stillExists = prev && res.data.find((c) => c._id === prev._id);
                return stillExists || res.data[0];
            });
        } else {
            setSelectedChannel(null);
        }
    };

    const myRole = selectedWorkspace?.workspace?.members?.find(m => m.user._id === userInfo._id)?.role;
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
            refreshChannels();
        } catch (err) {
            console.error('Failed to rename channel', err);
        }
    };

    const handleDeleteChannel = async () => {
        if (!selectedChannel) return;
        if (!confirm(`Delete #${selectedChannel.name}? This will remove all messages.`)) return;
        try {
            await axios.delete(`/api/channels/${selectedChannel._id}`);
            refreshChannels();
        } catch (err) {
            console.error('Failed to delete channel', err);
        }
    };

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
        <div className="px-8 py-10 h-[calc(100vh-120px)]">
            <div className="bg-white rounded-lg shadow-md h-full flex overflow-hidden">
                <aside className="w-64 border-r bg-gray-50 p-4">
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-sm font-semibold text-gray-700">Channels</h2>
                        {canManageChannels && (
                            <button
                                onClick={handleCreateChannel}
                                className="text-blue-600 hover:text-blue-700"
                                title="Create channel"
                            >
                                <Plus size={16} />
                            </button>
                        )}
                    </div>
                    <div className="space-y-2">
                        {channels.length === 0 && (
                            <div className="text-xs text-gray-500">No channels available.</div>
                        )}
                        {channels.map((ch) => (
                            <button
                                key={ch._id}
                                onClick={() => setSelectedChannel(ch)}
                                className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
                                    selectedChannel?._id === ch._id
                                        ? 'bg-blue-600 text-white'
                                        : 'text-gray-700 hover:bg-gray-100'
                                }`}
                            >
                                # {ch.name}
                            </button>
                        ))}
                    </div>
                </aside>
                <main className="flex-1">
                    {selectedChannel ? (
                        <div className="h-full flex flex-col">
                            <div className="flex items-center justify-between px-4 py-2 border-b bg-white">
                                <div className="text-sm font-semibold text-gray-800"># {selectedChannel.name}</div>
                                {canManageChannels && !selectedChannel.isGeneral && (
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={handleRenameChannel}
                                            className="text-gray-500 hover:text-blue-600"
                                            title="Rename channel"
                                        >
                                            <Pencil size={16} />
                                        </button>
                                        <button
                                            onClick={handleDeleteChannel}
                                            className="text-gray-500 hover:text-red-600"
                                            title="Delete channel"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                )}
                            </div>
                            <div className="flex-1">
                                <ChatArea channel={selectedChannel} workspaceId={currentWorkspaceId} canModerate={canManageChannels} showHeader={false} />
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex items-center justify-center text-gray-500">
                            Select a channel
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default WorkspaceChat;
