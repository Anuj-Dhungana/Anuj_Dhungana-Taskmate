import { ShieldAlert, UserPlus } from 'lucide-react';
import { useWorkspaceMembers } from '../hooks/useWorkspaceMembers';
import InviteUserModal from '../components/modals/InviteUserModal';
import ConfirmModal from '../components/modals/ConfirmModal';
import MemberStatsCards from '../components/members/MemberStatsCards';
import MembersTable from '../components/members/MembersTable';
import { WORKSPACE_PLAN, WORKSPACE_PLAN_FEATURES, normalizeWorkspacePlan } from '../constants/workspacePlans';
import { showUpgradeToProPrompt } from '../utils/upgradePrompts';
import { useNavigate } from 'react-router-dom';
import PageSkeleton from '../components/common/PageSkeleton';

const WorkspaceMembers = () => {
    const navigate = useNavigate();
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

    const currentPlan = normalizeWorkspacePlan(workspace?.settings?.billing?.currentPlan);
    const planFeatures = WORKSPACE_PLAN_FEATURES[currentPlan] || WORKSPACE_PLAN_FEATURES[WORKSPACE_PLAN.FREE];
    const memberLimitReached =
        planFeatures.maxMembers !== null && (workspace?.members?.length || 0) >= planFeatures.maxMembers;

    const handleInviteClick = () => {
        if (memberLimitReached) {
            showUpgradeToProPrompt({
                message: 'Upgrade to Pro to add more members.',
                onUpgrade: () => navigate('/settings'),
                ctaLabel: 'Upgrade to Pro',
            });
            return;
        }

        setShowInviteModal(true);
    };

    if (!currentWorkspaceId) {
        return (
            <div className="px-8 py-10">
                <div className="text-center text-gray-500">Select a workspace to view members.</div>
            </div>
        );
    }

    if (loading) {
        return <PageSkeleton kind="members" />;
    }

    if (!canInvite) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="flex items-center gap-3 bg-amber-50 text-amber-700 border border-amber-200 rounded-xl px-5 py-4 text-sm">
                    <ShieldAlert className="w-5 h-5 shrink-0" />
                    Team member management is available to workspace owners and admins only.
                </div>
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
                            onClick={handleInviteClick}
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                        >
                            <UserPlus size={18} />
                            Invite Member
                        </button>
                    )}
                </div>
            </div>

            {memberLimitReached && (
                <p className="mb-4 text-sm text-amber-700">
                    Upgrade to Pro to add more members.
                </p>
            )}

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
                    defaultRole={workspace?.settings?.access?.defaultInviteRole || 'member'}
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
