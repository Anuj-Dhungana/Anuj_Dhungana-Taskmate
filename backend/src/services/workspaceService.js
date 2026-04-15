import Workspace from '../models/Workspace.js';

export const ALLOWED_INVITE_ROLES = ['member', 'admin'];

export const findWorkspaceById = async (workspaceId) => Workspace.findById(workspaceId);

export const findWorkspaceByIdWithMembers = async (workspaceId) =>
    Workspace.findById(workspaceId).populate('members.user', 'fullname email avatar');

export const getWorkspaceMember = (workspace, userId) =>
    (workspace?.members || []).find((member) => String(member?.user) === String(userId));

export const isOwner = (member) => member?.role === 'owner';

export const isAdminOrOwner = (member) =>
    member && (member.role === 'owner' || member.role === 'admin');

export const isWorkspaceMember = (workspace, userId) =>
    (workspace?.members || []).some((member) => {
        const uid = member?.user?._id || member?.user;
        return String(uid) === String(userId);
    });

export const removeNullMembers = (workspace) => {
    if (!workspace) return { changed: false, members: [] };
    const validMembers = (workspace.members || []).filter((member) => member?.user != null);
    const changed = validMembers.length !== (workspace.members || []).length;
    return { changed, members: validMembers };
};

export const getMemberIndex = (workspace, memberId) =>
    (workspace?.members || []).findIndex(
        (member) => String(member?.user) === String(memberId)
    );

export const validateInviteRole = (role) => ALLOWED_INVITE_ROLES.includes(role);

export const canAdminRemoveTarget = (requester, targetMember) => {
    if (!requester || !targetMember) return false;
    if (requester.role === 'owner') return true;
    if (requester.role === 'admin') return targetMember.role === 'member';
    return false;
};

// ---------------------------------------------------------------------------
// Mutation helpers — extracted from workspaceController
// ---------------------------------------------------------------------------

/**
 * Add a member to a workspace and save.
 */
export const addMemberToWorkspace = async (workspace, userId, role = 'member') => {
    workspace.members.push({ user: userId, role });
    await workspace.save();
};

/**
 * Remove a member from a workspace and save.
 */
export const removeMemberFromWorkspace = async (workspace, memberId) => {
    workspace.members = workspace.members.filter(
        (m) => m.user.toString() !== memberId.toString()
    );
    await workspace.save();
};

/**
 * Update a member's role and save.
 * Returns the updated workspace.
 */
export const updateMemberRoleInWorkspace = async (workspace, memberId, newRole) => {
    const memberIndex = getMemberIndex(workspace, memberId);
    if (memberIndex === -1) {
        const err = new Error('Member not found');
        err.status = 404;
        throw err;
    }
    workspace.members[memberIndex].role = newRole;
    await workspace.save();
};

/**
 * Transfer workspace ownership from requester to a new owner.
 * Both role swaps happen atomically and the workspace is saved once.
 */
export const transferOwnership = async (workspace, requesterId, newOwnerId) => {
    const currentOwnerIndex = workspace.members.findIndex(
        (m) => String(m.user) === String(requesterId) && m.role === 'owner'
    );
    if (currentOwnerIndex === -1) {
        const err = new Error('Only the current owner can transfer ownership');
        err.status = 403;
        throw err;
    }

    const targetOwnerIndex = getMemberIndex(workspace, newOwnerId);
    if (targetOwnerIndex === -1) {
        const err = new Error('Target user must be a workspace member');
        err.status = 404;
        throw err;
    }

    if (workspace.members[targetOwnerIndex].role === 'owner') {
        const err = new Error('Selected member is already the owner');
        err.status = 400;
        throw err;
    }

    workspace.members[currentOwnerIndex].role = 'admin';
    workspace.members[targetOwnerIndex].role = 'owner';
    await workspace.save();
};

/**
 * Apply and validate settings updates to a workspace document.
 * Does NOT save — caller must call workspace.save().
 */
export const applyWorkspaceSettings = (workspace, settings) => {
    if (!settings || typeof settings !== 'object') return;

    const access =
        settings.access && typeof settings.access === 'object' ? settings.access : {};

    workspace.settings = workspace.settings || {};
    workspace.settings.access = workspace.settings.access || {};

    if (access.defaultInviteRole !== undefined) {
        if (!validateInviteRole(access.defaultInviteRole)) {
            const err = new Error('Invalid default invite role');
            err.status = 400;
            throw err;
        }
        workspace.settings.access.defaultInviteRole = access.defaultInviteRole;
    }

    if (access.requireInviteAcceptance !== undefined) {
        workspace.settings.access.requireInviteAcceptance = Boolean(access.requireInviteAcceptance);
    }

    if (access.membersCanViewMemberList !== undefined) {
        workspace.settings.access.membersCanViewMemberList = Boolean(access.membersCanViewMemberList);
    }
};
