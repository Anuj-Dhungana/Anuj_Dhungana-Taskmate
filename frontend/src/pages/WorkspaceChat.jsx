import { useState } from 'react';
import api from '../api';
import useWorkspaceStore from '../store/useWorkspaceStore';
import useAuthStore from '../store/useAuthStore';
import ChatArea from '../components/chat/ChatArea';
import ChatSidebar from '../components/chat/ChatSidebar';
import ChannelList from '../components/chat/ChannelList';
import DirectMessagesList from '../components/chat/DirectMessagesList';
import ChatHeader from '../components/chat/ChatHeader';
import DmPickerModal from '../components/chat/DmPickerModal';
import ChannelEditorModal from '../components/chat/ChannelEditorModal';
import AddChannelMembersModal from '../components/chat/AddChannelMembersModal';
import ConfirmModal from '../components/modals/ConfirmModal';
import { useWorkspaceChat } from '../hooks/useWorkspaceChat';
import PageSkeleton from '../components/common/PageSkeleton';
import useRightPanelStore from '../store/useRightPanelStore';
import PollVotesPanel from '../components/chat/PollVotesPanel';

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
    
    // Add Members Modal State
    const [showAddMembersModal, setShowAddMembersModal] = useState(false);
    const [addingMembers, setAddingMembers] = useState(false);
    const [addMembersError, setAddMembersError] = useState('');

    const { isOpen: isRightPanelOpen, panelType, panelData, closePanel } = useRightPanelStore();

    const {
        workspace,
        members,
        loading,
        search,
        setSearch,
        filteredChannels,
        filteredDMs,
        selectedConversation,
        showDmPicker,
        setShowDmPicker,
        dmSearch,
        setDmSearch,
        dmOptions,
        setSelectedChannel,
        handleCreateChannel,
        handleRenameChannel,
        handleAddMembersToChannel,
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
        setChannelEditorMode('create');
        setChannelName('');
        setChannelEditorError('');
        setShowChannelEditor(true);
    };

    const openRenameChannelModal = () => {
        setChannelEditorMode('rename');
        setChannelName(selectedConversation?.name || '');
        setChannelEditorError('');
        setShowChannelEditor(true);
    };

    const openDeleteConfirmModal = () => {
        setChannelToDelete(selectedConversation);
    };

    const closeChannelEditorModal = () => {
        if (savingChannel) return;
        setShowChannelEditor(false);
        setChannelEditorError('');
    };

    const submitChannelEditor = async (selectedMembers = []) => {
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
                await handleCreateChannel(trimmedName, selectedMembers);
            }
            setShowChannelEditor(false);
            setChannelName('');
        } catch (err) {
            setChannelEditorError(err?.response?.data?.message || 'Failed to save channel');
        } finally {
            setSavingChannel(false);
        }
    };

    const submitAddMembers = async (selectedMembers) => {
        setAddingMembers(true);
        setAddMembersError('');
        try {
            await handleAddMembersToChannel(selectedConversation._id, selectedMembers);
            setShowAddMembersModal(false);
        } catch (err) {
            setAddMembersError(err?.response?.data?.message || 'Failed to add members');
        } finally {
            setAddingMembers(false);
        }
    };

    const confirmDeleteChannel = async () => {
        if (!channelToDelete) return;
        setDeletingChannel(true);
        try {
            await api.delete(`/api/channels/${channelToDelete._id}`);
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
        return <PageSkeleton kind="chat" />;
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

                <main className="flex-1 min-h-0 flex flex-col relative transition-all duration-300">
                    {selectedConversation ? (
                        <>
                            <ChatHeader
                                conversation={selectedConversation}
                                workspaceName={workspaceName}
                                memberCount={selectedIsDM ? 2 : (selectedConversation.members?.length || memberCount)}
                                isDM={selectedIsDM}
                                canManage={canManageSelectedChannel}
                                onAddMembers={() => setShowAddMembersModal(true)}
                                onRename={openRenameChannelModal}
                                onDelete={openDeleteConfirmModal}
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

                {/* Desktop & Tablet: Right Sidebar */}
                {isRightPanelOpen && panelType === 'pollVotes' && panelData?.poll && (
                    <div className="hidden md:block w-[380px] shrink-0 border-l border-gray-200 h-full bg-slate-50 z-10 animate-in slide-in-from-right duration-200 ease-out">
                        <PollVotesPanel poll={panelData.poll} onClose={closePanel} />
                    </div>
                )}
                
                {/* Mobile: Overlay Sliding Drawer */}
                {isRightPanelOpen && panelType === 'pollVotes' && panelData?.poll && (
                    <div className="md:hidden fixed inset-0 z-[100] flex justify-end bg-black/20 animate-in fade-in duration-200 backdrop-blur-[1px]">
                        <div className="w-full h-full bg-slate-50 animate-in slide-in-from-right duration-200 ease-out shadow-[-10px_0_30px_rgba(0,0,0,0.1)]">
                            <PollVotesPanel poll={panelData.poll} onClose={closePanel} />
                        </div>
                    </div>
                )}
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
                workspaceMembers={members?.map(m => m.user).filter(Boolean) || []}
                currentUserId={userInfo?._id}
                onChange={(value) => {
                    setChannelName(value);
                    if (channelEditorError) setChannelEditorError('');
                }}
                onClose={closeChannelEditorModal}
                onSubmit={submitChannelEditor}
            />

            <AddChannelMembersModal
                isOpen={showAddMembersModal}
                channel={selectedConversation}
                workspaceMembers={members?.map(m => m.user).filter(Boolean) || []}
                currentUserId={userInfo?._id}
                loading={addingMembers}
                error={addMembersError}
                onClose={() => {
                    setShowAddMembersModal(false);
                    setAddMembersError('');
                }}
                onSubmit={submitAddMembers}
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
