import Workspace from '../models/Workspace.js';

export const ALLOWED_INVITE_ROLES = ['member', 'admin'];

export const findWorkspaceById = async (workspaceId) => Workspace.findById(workspaceId);

export const findWorkspaceByIdWithMembers = async (workspaceId) =>
    Workspace.findById(workspaceId).populate('members.user', 'fullname email avatar');

export const getWorkspaceMember = (workspace, userId) =>
    (workspace?.members || []).find((member) => String(member?.user) === String(userId));

export const isOwner = (member) => member?.role === 'owner';

export const isAdminOrOwner = (member) => member && (member.role === 'owner' || member.role === 'admin');

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
    (workspace?.members || []).findIndex((member) => String(member?.user) === String(memberId));

export const validateInviteRole = (role) => ALLOWED_INVITE_ROLES.includes(role);

export const canAdminRemoveTarget = (requester, targetMember) => {
    if (!requester || !targetMember) return false;
    if (requester.role === 'owner') return true;
    if (requester.role === 'admin') return targetMember.role === 'member';
    return false;
};
