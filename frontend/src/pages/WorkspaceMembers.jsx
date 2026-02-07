import { UserPlus } from 'lucide-react';
import { useWorkspaceMembers } from '../hooks/useWorkspaceMembers';
import InviteUserModal from '../components/modals/InviteUserModal';
import ConfirmModal from '../components/modals/ConfirmModal';
import MemberStatsCards from '../components/members/MemberStatsCards';
import MembersTable from '../components/members/MembersTable';

const WorkspaceMembers = () => {
    const {
        loading,
        currentWorkspaceId,
        workspace,
        filteredMembers,
        stats,
        tasksByUser,
        projectsByUser,
        myRole,
        canInvite,
        userInfo,
        search,
        setSearch,
        showInviteModal,
        setShowInviteModal,
        openMenuId,
        setOpenMenuId,
        memberToRemove,
        setMemberToRemove,
        removingMember,
        handleRoleChange,
        handleKick,
        confirmKick,
        refreshWorkspace,
    } = useWorkspaceMembers();

    if (!currentWorkspaceId) {
        return (
            <div className="px-8 py-10">
                <div className="text-center text-gray-500">Select a workspace to view members.</div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="px-8 py-10">
                <div className="text-gray-500">Loading members...</div>
            </div>
        );
    }

    return (
        <div className="px-8 py-10">
            <div className="mb-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Team Members</h1>
                        <p className="text-gray-500 text-sm">Manage your team members and their permissions.</p>
                    </div>
                    {canInvite && (
                        <button
                            onClick={() => setShowInviteModal(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                        >
                            <UserPlus size={18} />
                            Invite Member
                        </button>
                    )}
                </div>
            </div>

            <MemberStatsCards stats={stats} />

            <MembersTable
                filteredMembers={filteredMembers}
                currentUserId={userInfo?._id}
                myRole={myRole}
                projectsByUser={projectsByUser}
                tasksByUser={tasksByUser}
                openMenuId={openMenuId}
                onToggleMenu={(id) => setOpenMenuId((prev) => (prev === id ? null : id))}
                onRoleChange={handleRoleChange}
                onKick={handleKick}
                search={search}
                onSearchChange={setSearch}
            />

            {showInviteModal && (
                <InviteUserModal
                    isOpen={showInviteModal}
                    onClose={() => {
                        setShowInviteModal(false);
                        refreshWorkspace();
                    }}
                    workspaceId={workspace?._id}
                />
            )}

            <ConfirmModal
                isOpen={!!memberToRemove}
                title="Remove Member"
                message={`Remove ${memberToRemove?.fullname || 'this user'} from the workspace?`}
                confirmText="Remove"
                cancelText="Cancel"
                variant="danger"
                loading={removingMember}
                onClose={() => !removingMember && setMemberToRemove(null)}
                onConfirm={confirmKick}
            />
        </div>
    );
};

export default WorkspaceMembers;
