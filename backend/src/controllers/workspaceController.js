import Workspace from '../models/Workspace.js';
import Project from '../models/Project.js';
import Channel from '../models/Channel.js';
import User from '../models/User.js';
import { WORKSPACE_PLAN } from '../config/workspacePlans.js';
import {
    findWorkspaceById,
    findWorkspaceByIdWithMembers,
    getWorkspaceMember,
    isAdminOrOwner,
    isWorkspaceMember,
    removeNullMembers,
    getMemberIndex,
    validateInviteRole,
} from '../services/workspaceService.js';
import { canAddMembersToWorkspace } from '../services/workspacePlanService.js';
import {
    emitMemberAdded,
    emitMemberRemoved,
    emitRoleChanged,
    emitWorkspaceUpdated,
} from '../services/realtimeService.js';


// POST /api/workspaces
export const createWorkspace = async (req, res) => {
    try {
        const { name, description, color } = req.body;
        const safeColor = typeof color === 'string' && color.trim() ? color : undefined;

        const workspace = await Workspace.create({
            name,
            description,
            color: safeColor,
            members: [{ user: req.user._id, role: 'owner' }],
            settings: { billing: { currentPlan: WORKSPACE_PLAN.FREE } },
        });

        await Channel.create({
            name: 'general',
            workspace: workspace._id,
            type: 'channel',
            isGeneral: true,
        });

        res.status(201).json(workspace);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// GET /api/workspaces
export const getMyWorkspaces = async (req, res) => {
    try {
        const workspaces = await Workspace.find({
            'members.user': req.user._id,
        }).sort({ createdAt: -1 });
        res.json(workspaces);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// GET /api/workspaces/:id
export const getWorkspaceDetails = async (req, res) => {
    try {
        const workspaceId = req.params.id;
        const workspace = await findWorkspaceByIdWithMembers(workspaceId);
        if (!workspace) {
            return res.status(404).json({ message: 'Workspace not found' });
        }

        const { changed, members } = removeNullMembers(workspace);
        if (changed) {
            workspace.members = members;
            await workspace.save();
        }

        if (!isWorkspaceMember(workspace, req.user._id)) {
            return res.status(403).json({ message: 'Not authorized to view this workspace' });
        }

        const projects = await Project.find({ workspace: workspaceId }).sort({ createdAt: -1 });
        const channels = await Channel.find({
            workspace: workspaceId,
            type: { $in: ['channel', null] },
        }).sort({ name: 1 });

        res.json({ workspace, projects, channels });
    } catch (error) {
        console.error('getWorkspaceDetails Error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// POST /api/workspaces/:id/invite
export const inviteUserToWorkspace = async (req, res) => {
    try {
        const { email } = req.body;
        const workspaceId = req.params.id;

        const workspace = await findWorkspaceById(workspaceId);
        if (!workspace) {
            return res.status(404).json({ message: 'Workspace not found' });
        }

        const requester = getWorkspaceMember(workspace, req.user._id);
        if (!isAdminOrOwner(requester)) {
            return res.status(403).json({ message: 'Only Admins can invite users' });
        }

        const userToInvite = await User.findOne({ email });
        if (!userToInvite) {
            return res.status(404).json({
                message: 'User not found. Ask them to register on TaskMate first!',
            });
        }

        if (isWorkspaceMember(workspace, userToInvite._id)) {
            return res.status(400).json({ message: 'User is already in this workspace' });
        }

        const memberAllowance = canAddMembersToWorkspace(workspace, 1);
        if (!memberAllowance.allowed) {
            return res.status(403).json({
                code: 'MEMBER_LIMIT_REACHED',
                message: `Free plan allows up to ${memberAllowance.limit} members in this workspace. Upgrade to Pro for unlimited members.`,
                limit: memberAllowance.limit,
                currentCount: memberAllowance.currentMembers,
            });
        }

        workspace.members.push({ user: userToInvite._id, role: 'member' });
        await workspace.save();
        emitMemberAdded(req, workspace._id, userToInvite._id, 'member');

        res.json({ message: `${userToInvite.fullname} added to workspace!` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// PUT /api/workspaces/:id/role
export const updateMemberRole = async (req, res) => {
    try {
        const { memberId, newRole } = req.body;
        const workspace = req.workspace;
        const requester = getWorkspaceMember(workspace, req.user._id);

        if (!requester) {
            return res.status(403).json({ message: 'Not authorized' });
        }
        if (!['admin', 'member'].includes(newRole)) {
            return res.status(400).json({ message: 'Invalid role' });
        }

        const memberIndex = getMemberIndex(workspace, memberId);
        if (memberIndex === -1) {
            return res.status(404).json({ message: 'Member not found' });
        }
        if (workspace.members[memberIndex].role === 'owner') {
            return res.status(400).json({ message: "Cannot change the Owner's role" });
        }
        if (requester.role === 'admin') {
            return res.status(403).json({ message: 'Only owners can change member roles' });
        }

        workspace.members[memberIndex].role = newRole;
        await workspace.save();
        emitRoleChanged(req, workspace._id, memberId, newRole);

        res.json({ message: 'Role updated successfully' });
    } catch (error) {
        console.error('Update Role Error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// DELETE /api/workspaces/:id/members/:memberId
export const removeMember = async (req, res) => {
    try {
        const { memberId } = req.params;
        const workspace = req.workspace;
        const requester = getWorkspaceMember(workspace, req.user._id);

        if (!requester) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const memberToRemove = getWorkspaceMember(workspace, memberId);
        if (!memberToRemove) {
            return res.status(404).json({ message: 'Member not found' });
        }
        if (memberToRemove.role === 'owner') {
            return res.status(400).json({ message: 'Cannot remove the Workspace Owner' });
        }
        if (requester.role === 'admin' && memberToRemove.role !== 'member') {
            return res.status(403).json({ message: 'Admins can only remove members' });
        }

        workspace.members = workspace.members.filter(
            (m) => m.user.toString() !== memberId
        );
        await workspace.save();
        emitMemberRemoved(req, workspace._id, memberId);

        const io = req.app.get('io');
        if (io) {
            io.to(`user_${memberId}`).emit('fetch_workspaces');
        }

        res.json({ message: 'Member removed from workspace' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// DELETE /api/workspaces/:id
export const deleteWorkspace = async (req, res) => {
    try {
        await req.workspace.deleteOne();
        res.json({ message: 'Workspace deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// PUT /api/workspaces/:id
export const updateWorkspace = async (req, res) => {
    try {
        const { name, description, color, settings } = req.body;
        const workspace = req.workspace;

        if (!workspace) {
            return res.status(404).json({ message: 'Workspace not found' });
        }

        if (name !== undefined) workspace.name = name;
        if (description !== undefined) workspace.description = description;
        if (color !== undefined) workspace.color = color;

        // Apply and validate settings inline (tests mock validateInviteRole from workspaceService)
        if (settings && typeof settings === 'object') {
            const access = settings.access && typeof settings.access === 'object' ? settings.access : {};

            workspace.settings = workspace.settings || {};
            workspace.settings.access = workspace.settings.access || {};

            if (access.defaultInviteRole !== undefined) {
                if (!validateInviteRole(access.defaultInviteRole)) {
                    return res.status(400).json({ message: 'Invalid default invite role' });
                }
                workspace.settings.access.defaultInviteRole = access.defaultInviteRole;
            }

            if (access.requireInviteAcceptance !== undefined) {
                workspace.settings.access.requireInviteAcceptance = Boolean(access.requireInviteAcceptance);
            }

            if (access.membersCanViewMemberList !== undefined) {
                workspace.settings.access.membersCanViewMemberList = Boolean(access.membersCanViewMemberList);
            }
        }

        const saved = await workspace.save();
        const updated = await Workspace.findById(saved._id).populate(
            'members.user',
            'fullname email avatar'
        );
        emitWorkspaceUpdated(req, workspace._id, updated);
        res.json(updated);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// POST /api/workspaces/:id/transfer-ownership
export const transferWorkspaceOwnership = async (req, res) => {
    try {
        const workspace = req.workspace;
        const { newOwnerId } = req.body;
        const requesterId = String(req.user?._id || '');
        const targetOwnerId = String(newOwnerId || '');

        if (!workspace) {
            return res.status(404).json({ message: 'Workspace not found' });
        }
        if (!targetOwnerId) {
            return res.status(400).json({ message: 'newOwnerId is required' });
        }
        if (targetOwnerId === requesterId) {
            return res.status(400).json({ message: 'You are already the owner' });
        }

        // Check requester is current owner (inline so test mock for workspace.members works)
        const currentOwner = (workspace.members || []).find(
            (m) => String(m.user) === requesterId && m.role === 'owner'
        );
        if (!currentOwner) {
            return res.status(403).json({ message: 'Only the current owner can transfer ownership' });
        }

        const targetIndex = getMemberIndex(workspace, targetOwnerId);
        if (targetIndex === -1) {
            return res.status(404).json({ message: 'Target user must be a workspace member' });
        }

        // Swap roles
        currentOwner.role = 'admin';
        workspace.members[targetIndex].role = 'owner';
        await workspace.save();

        const updatedWorkspace = await Workspace.findById(workspace._id).populate(
            'members.user',
            'fullname email avatar'
        );
        const workspaceId = workspace._id.toString();

        emitRoleChanged(req, workspaceId, requesterId, 'admin');
        emitRoleChanged(req, workspaceId, targetOwnerId, 'owner');
        emitWorkspaceUpdated(req, workspaceId, updatedWorkspace);

        res.json({ message: 'Ownership transferred successfully', workspace: updatedWorkspace });
    } catch (error) {
        console.error('transferWorkspaceOwnership Error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};
