import { useEffect, useState } from 'react';
import axios from 'axios';
import useWorkspaceStore from '../store/userWorkspaceStore';
import ChatArea from '../components/Chat/ChatArea';

const WorkspaceChat = () => {
    const { currentWorkspaceId, selectedWorkspace, setSelectedWorkspace } = useWorkspaceStore();
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
                if (!selectedWorkspace || selectedWorkspace.workspace?._id !== currentWorkspaceId) {
                    const res = await axios.get(`/api/workspaces/${currentWorkspaceId}`);
                    setSelectedWorkspace(res.data);
                    setChannels(res.data.channels || []);
                    if (res.data.channels?.length) {
                        setSelectedChannel(res.data.channels[0]);
                    }
                } else {
                    setChannels(selectedWorkspace.channels || []);
                    if (selectedWorkspace.channels?.length) {
                        setSelectedChannel(selectedWorkspace.channels[0]);
                    }
                }
            } catch (err) {
                console.error('Failed to load channels', err);
            } finally {
                setLoading(false);
            }
        };
        loadWorkspace();
    }, [currentWorkspaceId, selectedWorkspace]);

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
                    <h2 className="text-sm font-semibold text-gray-700 mb-3">Channels</h2>
                    <div className="space-y-2">
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
                        <ChatArea channel={selectedChannel} workspaceId={currentWorkspaceId} />
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
