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
import ChannelEditorModal from '../components/chat/ChannelEditorModal';
import ConfirmModal from '../components/modals/ConfirmModal';
import { useWorkspaceChat } from '../hooks/useWorkspaceChat';

const WorkspaceChat = () => {
    const { currentWorkspaceId } = useWorkspaceStore();
    const { userInfo } = useAuthStore();
    const [channelToDelete, setChannelToDelete] = useState(null);
    const [deletingChannel, setDeletingChannel] = useState(false);
    const [showChannelEditor, setShowChannelEditor] = useState(false);
    const [channelEditorMode, setChannelEditorMode] = useState('create');
    const [channelName, setChannelName] = useState('');
    const [channelEditorError, setChannelEditorError] = useState('');
    const [savingChannel, setSavingChannel] = useState(false);

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

    const openCreateChannelModal = () => {
        setShowChannelMenu(false);
        setChannelEditorMode('create');
        setChannelName('');
        setChannelEditorError('');
        setShowChannelEditor(true);
    };

    const openRenameChannelModal = () => {
        if (!selectedConversation || selectedIsDM) return;
        setShowChannelMenu(false);
        setChannelEditorMode('rename');
        setChannelName(selectedConversation.name || '');
        setChannelEditorError('');
        setShowChannelEditor(true);
    };

    const closeChannelEditorModal = () => {
        if (savingChannel) return;
        setShowChannelEditor(false);
        setChannelEditorError('');
    };

    const submitChannelEditor = async () => {
        const trimmedName = channelName.trim();
        if (!trimmedName) {
            setChannelEditorError('Channel name is required');
            return;
        }

        setSavingChannel(true);
        setChannelEditorError('');
        try {
            if (channelEditorMode === 'rename') {
                await handleRenameChannel(trimmedName);
            } else {
                await handleCreateChannel(trimmedName);
            }
            setShowChannelEditor(false);
            setChannelName('');
        } catch (err) {
            setChannelEditorError(err?.response?.data?.message || 'Failed to save channel');
        } finally {
            setSavingChannel(false);
        }
    };

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
            <div className="h-full min-h-0 flex items-center justify-center">
                <div className="text-center text-gray-500">Select a workspace to open chat.</div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="h-full min-h-0 flex items-center justify-center">
                <div className="text-gray-500">Loading chat...</div>
            </div>
        );
    }

    return (
        <div className="h-full min-h-0">
            <div className="h-full min-h-0 flex overflow-hidden">
                <ChatSidebar search={search} onSearchChange={setSearch}>
                    <ChannelList
                        channels={filteredChannels}
                        selectedChannel={selectedConversation}
                        onSelectChannel={setSelectedChannel}
                        canManageChannels={canManageChannels}
                        onCreateChannel={openCreateChannelModal}
                    />
                    <DirectMessagesList
                        dmThreads={filteredDMs}
                        selectedChannel={selectedConversation}
                        onSelectChannel={setSelectedChannel}
                        onCreateDm={() => setShowDmPicker(true)}
                    />
                </ChatSidebar>

                <main className="flex-1 min-h-0 flex flex-col">
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
                                onRename={openRenameChannelModal}
                                onDelete={handleDeleteChannel}
                            />
                            <div className="flex-1 min-h-0">
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
                        <div className="flex-1 min-h-0 flex items-center justify-center text-gray-500">
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

            <ChannelEditorModal
                isOpen={showChannelEditor}
                mode={channelEditorMode}
                value={channelName}
                error={channelEditorError}
                loading={savingChannel}
                onChange={(value) => {
                    setChannelName(value);
                    if (channelEditorError) setChannelEditorError('');
                }}
                onClose={closeChannelEditorModal}
                onSubmit={submitChannelEditor}
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
