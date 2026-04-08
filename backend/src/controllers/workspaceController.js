import Workspace from '../models/Workspace.js';
import Project from '../models/Project.js';
import Channel from '../models/Channel.js';
import User from '../models/User.js';
import Payment from '../models/Payment.js';
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


export const createWorkspace = async (req, res) => {
    try {
        const { name, description, color } = req.body;

        // Simple guard: ensure color is a string if provided
        const safeColor = typeof color === 'string' && color.trim() ? color : undefined;

        // 1. Create Workspace
        const workspace = await Workspace.create({
            name,
            description,
            color: safeColor,
            members: [{ user: req.user._id, role: 'owner' }],
            settings: {
                billing: {
                    currentPlan: WORKSPACE_PLAN.FREE,
                },
            },
        });

        // 2. Automatically create a "General" channel 
        await Channel.create({
            name: 'general',
            workspace: workspace._id,
            type: 'channel',
            isGeneral: true
        });

        res.status(201).json(workspace);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};


export const getMyWorkspaces = async (req, res) => {
    try {
        // Find workspaces where the members array contains the user's ID
        const workspaces = await Workspace.find({
            "members.user": req.user._id
        }).sort({ createdAt: -1 });

        res.json(workspaces);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

export const getWorkspaceDetails = async (req, res) => {
    try {
        const workspaceId = req.params.id;

        // 1. Check if workspace exists
        const workspace = await findWorkspaceByIdWithMembers(workspaceId);
        
        if (!workspace) {
            return res.status(404).json({ message: "Workspace not found" });
        }

        // Clean out any members whose user no longer exists in the database
        const { changed, members } = removeNullMembers(workspace);
        if (changed) {
            workspace.members = members;
            await workspace.save();
        }

        // 2. Check if user is a member (Security)
        const isMember = isWorkspaceMember(workspace, req.user._id);
        if (!isMember) {
            return res.status(403).json({ message: "Not authorized to view this workspace" });
        }

        // 3. Fetch Channels and Projects belonging to this workspace
        const projects = await Project.find({ workspace: workspaceId }).sort({ createdAt: -1 });
        const channels = await Channel.find({ 
            workspace: workspaceId, 
            type: { $in: ['channel', null] } 
        }).sort({ name: 1 });

        res.json({
            workspace,
            projects,
            channels
        });

    } catch (error) {
        console.error("getWorkspaceDetails Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};


export const inviteUserToWorkspace = async (req, res) => {
    try {
        const { email } = req.body;
        const workspaceId = req.params.id;

        // 1. Find Workspace
        const workspace = await findWorkspaceById(workspaceId);
        if (!workspace) {
            return res.status(404).json({ message: "Workspace not found" });
        }

        // 2. Check Permissions (Only Owner/Admin can invite)
        const requester = getWorkspaceMember(workspace, req.user._id);
        if (!isAdminOrOwner(requester)) {
            return res.status(403).json({ message: "Only Admins can invite users" });
        }

        // 3. Find User to Invite
        const userToInvite = await User.findOne({ email });
        if (!userToInvite) {
            return res.status(404).json({ message: "User not found. Ask them to register on TaskMate first!" });
        }

        // 4. Check if already a member
        const isAlreadyMember = isWorkspaceMember(workspace, userToInvite._id);
        if (isAlreadyMember) {
            return res.status(400).json({ message: "User is already in this workspace" });
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

        // 5. Add to Workspace
        workspace.members.push({
            user: userToInvite._id,
            role: 'member' // Default role
        });

        await workspace.save();
        emitMemberAdded(req, workspace._id, userToInvite._id, 'member');

        res.json({ message: `${userToInvite.fullname} added to workspace!` });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error" });
    }
};



export const updateMemberRole = async (req, res) => {
    try {
        const { memberId, newRole } = req.body; 
        const workspace = req.workspace; // From middleware
        const requester = getWorkspaceMember(workspace, req.user._id);

        if (!requester) {
            return res.status(403).json({ message: "Not authorized" });
        }

        if (!['admin', 'member'].includes(newRole)) {
            return res.status(400).json({ message: "Invalid role" });
        }

        // 1. Find the member in the array
        const memberIndex = getMemberIndex(workspace, memberId);
        
        if (memberIndex === -1) {
            return res.status(404).json({ message: "Member not found" });
        }

        // 2. Prevent changing the Owner's role (FIXED LOGIC)
        // We check the *current role* of the person you are trying to change
        if (workspace.members[memberIndex].role === 'owner') {
            return res.status(400).json({ message: "Cannot change the Owner's role" });
        }

        // Admins cannot change any roles — only owners can promote/demote
        if (requester.role === 'admin') {
            return res.status(403).json({ message: "Only owners can change member roles" });
        }

        // 3. Update the role
        workspace.members[memberIndex].role = newRole;
        await workspace.save();
        emitRoleChanged(req, workspace._id, memberId, newRole);

        res.json({ message: "Role updated successfully" });

    } catch (error) {
        console.error("Update Role Error:", error); 
        res.status(500).json({ message: "Server Error" });
    }
};


export const removeMember = async (req, res) => {
    try {
        const { memberId } = req.params;
        const workspace = req.workspace;
        const requester = getWorkspaceMember(workspace, req.user._id);

        if (!requester) {
            return res.status(403).json({ message: "Not authorized" });
        }

        // Prevent removing the Owner
        const memberToRemove = getWorkspaceMember(workspace, memberId);

        if (!memberToRemove) {
            return res.status(404).json({ message: "Member not found" });
        }
        
        if (memberToRemove && memberToRemove.role === 'owner') {
            return res.status(400).json({ message: "Cannot remove the Workspace Owner" });
        }

        if (requester.role === 'admin' && memberToRemove.role !== 'member') {
            return res.status(403).json({ message: "Admins can only remove members" });
        }

        // Filter out the member
        workspace.members = workspace.members.filter(
            (m) => m.user.toString() !== memberId
        );

        await workspace.save();
        emitMemberRemoved(req, workspace._id, memberId);
        // Tell the removed user's active UI to re-fetch workspaces to instantly update their sidebar
        const io = req.app.get('io');
        if (io) {
            io.to(`user_${memberId}`).emit('fetch_workspaces');
        }

        res.json({ message: "Member removed from workspace" });

    } catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
};


export const deleteWorkspace = async (req, res) => {
    try {
        const workspaceId = req.params.id;
    
        await req.workspace.deleteOne();

        res.json({ message: "Workspace deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
};

export const updateWorkspace = async (req, res) => {
    try {
        const { name, description, color, settings } = req.body;
        const workspace = req.workspace;

        if (!workspace) {
            return res.status(404).json({ message: "Workspace not found" });
        }

        if (name !== undefined) workspace.name = name;
        if (description !== undefined) workspace.description = description;
        if (color !== undefined) workspace.color = color;

        if (settings && typeof settings === 'object') {
            const access = settings.access && typeof settings.access === 'object' ? settings.access : {};

            workspace.settings = workspace.settings || {};
            workspace.settings.access = workspace.settings.access || {};

            if (access.defaultInviteRole !== undefined) {
                if (!validateInviteRole(access.defaultInviteRole)) {
                    return res.status(400).json({ message: "Invalid default invite role" });
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
        const updated = await Workspace.findById(saved._id).populate('members.user', 'fullname email avatar');
        emitWorkspaceUpdated(req, workspace._id, updated);
        res.json(updated);
    } catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
};

export const transferWorkspaceOwnership = async (req, res) => {
    try {
        const workspace = req.workspace;
        const { newOwnerId } = req.body;
        const requesterId = String(req.user?._id || '');
        const targetOwnerId = String(newOwnerId || '');

        if (!workspace) {
            return res.status(404).json({ message: "Workspace not found" });
        }

        if (!targetOwnerId) {
            return res.status(400).json({ message: "newOwnerId is required" });
        }

        if (targetOwnerId === requesterId) {
            return res.status(400).json({ message: "You are already the owner" });
        }

        const currentOwnerIndex = workspace.members.findIndex(
            (member) => String(member.user) === requesterId && member.role === 'owner'
        );

        if (currentOwnerIndex === -1) {
            return res.status(403).json({ message: "Only the current owner can transfer ownership" });
        }

        const targetOwnerIndex = getMemberIndex(workspace, targetOwnerId);

        if (targetOwnerIndex === -1) {
            return res.status(404).json({ message: "Target user must be a workspace member" });
        }

        const targetMember = workspace.members[targetOwnerIndex];
        if (targetMember.role === 'owner') {
            return res.status(400).json({ message: "Selected member is already the owner" });
        }

        workspace.members[currentOwnerIndex].role = 'admin';
        workspace.members[targetOwnerIndex].role = 'owner';
        await workspace.save();

        const updatedWorkspace = await Workspace.findById(workspace._id).populate('members.user', 'fullname email avatar');
        const workspaceId = workspace._id.toString();

        emitRoleChanged(req, workspaceId, requesterId, 'admin');
        emitRoleChanged(req, workspaceId, targetOwnerId, 'owner');
        emitWorkspaceUpdated(req, workspaceId, updatedWorkspace);

        res.json({
            message: "Ownership transferred successfully",
            workspace: updatedWorkspace,
        });
    } catch (error) {
        console.error('transferWorkspaceOwnership Error:', error);
        res.status(500).json({ message: "Server Error" });
    }
};

export const getWorkspacePaymentHistory = async (req, res) => {
    try {
        const workspace = req.workspace;
        if (!workspace) {
            return res.status(404).json({ message: "Workspace not found" });
        }

        const payments = await Payment.find({ workspace: workspace._id })
            .select('amount paymentMethod status paidAt createdAt khaltiTransactionId purchaseOrderId')
            .sort({ createdAt: -1 });

        res.json({ payments });
    } catch (error) {
        console.error('getWorkspacePaymentHistory Error:', error);
        res.status(500).json({ message: "Server Error" });
    }
};
