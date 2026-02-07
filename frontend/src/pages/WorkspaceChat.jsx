import { useState } from 'react';
import axios from 'axios';
import useWorkspaceStore from '../store/useWorkspaceStore';
import useAuthStore from '../store/useAuthStore';
import ChatArea from '../components/chat/ChatArea';
import ChatSidebar from '../components/chat/ChatSidebar';
import ChannelList from '../components/chat/ChannelList';
import DirectMessagesList from '../components/chat/DirectMessagesList';
import ChatHeader from '../components/chat/ChatHeader';
import DmPickerModal from '../components/chat/DmPickerModal';
import ConfirmModal from '../components/modals/ConfirmModal';
import { useWorkspaceChat } from '../hooks/useWorkspaceChat';

const WorkspaceChat = () => {
    const { currentWorkspaceId } = useWorkspaceStore();
    const { userInfo } = useAuthStore();
    const [channelToDelete, setChannelToDelete] = useState(null);
    const [deletingChannel, setDeletingChannel] = useState(false);

    const {
        workspace,
        members,
        loading,
        search,
        setSearch,
        filteredChannels,
        filteredDMs,
        selectedConversation,
        showChannelMenu,
        setShowChannelMenu,
        showDmPicker,
        setShowDmPicker,
        dmSearch,
        setDmSearch,
        dmOptions,
        setSelectedChannel,
        handleCreateChannel,
        handleRenameChannel,
        handleCreateDM,
        refreshChannels,
    } = useWorkspaceChat(currentWorkspaceId, userInfo?._id);

    const workspaceData = workspace?.workspace;
    const workspaceName = workspaceData?.name || 'Workspace';
    const memberCount = members.length;
    const myRole = members.find((m) => m.user?._id === userInfo?._id)?.role;
    const canManageChannels = myRole === 'owner' || myRole === 'admin';
    const selectedIsDM = selectedConversation?.type === 'dm';
    const canManageSelectedChannel = canManageChannels && !selectedIsDM;

    const handleDeleteChannel = async () => {
        if (!selectedConversation) return;
        setChannelToDelete(selectedConversation);
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
                <ChatSidebar search={search} onSearchChange={setSearch}>
                    <ChannelList
                        channels={filteredChannels}
                        selectedChannel={selectedConversation}
                        onSelectChannel={setSelectedChannel}
                        canManageChannels={canManageChannels}
                        onCreateChannel={handleCreateChannel}
                    />
                    <DirectMessagesList
                        dmThreads={filteredDMs}
                        selectedChannel={selectedConversation}
                        onSelectChannel={setSelectedChannel}
                        onCreateDm={() => setShowDmPicker(true)}
                    />
                </ChatSidebar>

                <main className="flex-1 flex flex-col">
                    {selectedConversation ? (
                        <>
                            <ChatHeader
                                conversation={selectedConversation}
                                workspaceName={workspaceName}
                                memberCount={memberCount}
                                isDM={selectedIsDM}
                                canManage={canManageSelectedChannel}
                                showMenu={showChannelMenu}
                                onMenuToggle={() => setShowChannelMenu((v) => !v)}
                                onRename={handleRenameChannel}
                                onDelete={handleDeleteChannel}
                            />
                            <div className="flex-1">
                                <ChatArea
                                    channel={selectedConversation}
                                    workspaceId={currentWorkspaceId}
                                    canModerate={canManageSelectedChannel}
                                    showHeader={false}
                                    displayName={selectedIsDM ? selectedConversation.displayName : selectedConversation.name}
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

            <DmPickerModal
                isOpen={showDmPicker}
                members={dmOptions}
                searchTerm={dmSearch}
                onSearchChange={setDmSearch}
                onSelectMember={handleCreateDM}
                onClose={() => {
                    setShowDmPicker(false);
                    setDmSearch('');
                }}
            />

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
