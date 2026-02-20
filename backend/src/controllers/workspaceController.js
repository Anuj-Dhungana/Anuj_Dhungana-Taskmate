import Workspace from '../models/Workspace.js';
import Project from '../models/Project.js';
import Channel from '../models/Channel.js';
import User from '../models/User.js';

const ALLOWED_INVITE_ROLES = ['member', 'admin'];


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
            members: [{ user: req.user._id, role: 'owner' }]
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
        const workspace = await Workspace.findById(workspaceId).populate('members.user', 'fullname email avatar');
        
        if (!workspace) {
            return res.status(404).json({ message: "Workspace not found" });
        }

        // Clean out any members whose user no longer exists in the database
        const validMembers = workspace.members.filter(m => m.user != null);
        if (validMembers.length !== workspace.members.length) {
            workspace.members = validMembers;
            await workspace.save();
        }

        // 2. Check if user is a member (Security)
        const isMember = workspace.members.some(m => m.user?._id?.toString() === req.user._id.toString());
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
        const workspace = await Workspace.findById(workspaceId);
        if (!workspace) {
            return res.status(404).json({ message: "Workspace not found" });
        }

        // 2. Check Permissions (Only Owner/Admin can invite)
        const requester = workspace.members.find(m => m.user.toString() === req.user._id.toString());
        if (!requester || (requester.role !== 'owner' && requester.role !== 'admin')) {
            return res.status(403).json({ message: "Only Admins can invite users" });
        }

        // 3. Find User to Invite
        const userToInvite = await User.findOne({ email });
        if (!userToInvite) {
            return res.status(404).json({ message: "User not found. Ask them to register on TaskMate first!" });
        }

        // 4. Check if already a member
        const isAlreadyMember = workspace.members.some(m => m.user.toString() === userToInvite._id.toString());
        if (isAlreadyMember) {
            return res.status(400).json({ message: "User is already in this workspace" });
        }

        // 5. Add to Workspace
        workspace.members.push({
            user: userToInvite._id,
            role: 'member' // Default role
        });

        await workspace.save();
        const io = req.app.get('io');
        io?.to(`workspace_${workspace._id}`).emit('member_added', {
            workspaceId: workspace._id.toString(),
            member: {
                user: userToInvite._id.toString(),
                role: 'member',
            },
        });

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
        const requester = workspace.members.find(
            (m) => m.user.toString() === req.user._id.toString()
        );

        if (!requester) {
            return res.status(403).json({ message: "Not authorized" });
        }

        if (!['admin', 'member'].includes(newRole)) {
            return res.status(400).json({ message: "Invalid role" });
        }

        // 1. Find the member in the array
        const memberIndex = workspace.members.findIndex(
            m => m.user.toString() === memberId
        );
        
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

        const io = req.app.get('io');
        io?.to(`workspace_${workspace._id}`).emit('role_changed', {
            workspaceId: workspace._id.toString(),
            member: {
                user: memberId,
                role: newRole,
            },
        });

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
        const requester = workspace.members.find(
            (m) => m.user.toString() === req.user._id.toString()
        );

        if (!requester) {
            return res.status(403).json({ message: "Not authorized" });
        }

        // Prevent removing the Owner
        const memberToRemove = workspace.members.find(m => m.user.toString() === memberId);

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
        const io = req.app.get('io');
        io?.to(`workspace_${workspace._id}`).emit('member_removed', {
            workspaceId: workspace._id.toString(),
            member: {
                user: memberId,
            },
        });
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
                if (!ALLOWED_INVITE_ROLES.includes(access.defaultInviteRole)) {
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
        const io = req.app.get('io');
        io?.to(`workspace_${workspace._id}`).emit('workspace_updated', {
            workspaceId: workspace._id.toString(),
            workspace: updated,
        });
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

        const targetOwnerIndex = workspace.members.findIndex(
            (member) => String(member.user) === targetOwnerId
        );

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
        const io = req.app.get('io');
        const workspaceId = workspace._id.toString();

        io?.to(`workspace_${workspaceId}`).emit('role_changed', {
            workspaceId,
            member: {
                user: requesterId,
                role: 'admin',
            },
        });
        io?.to(`workspace_${workspaceId}`).emit('role_changed', {
            workspaceId,
            member: {
                user: targetOwnerId,
                role: 'owner',
            },
        });
        io?.to(`workspace_${workspaceId}`).emit('workspace_updated', {
            workspaceId,
            workspace: updatedWorkspace,
        });

        res.json({
            message: "Ownership transferred successfully",
            workspace: updatedWorkspace,
        });
    } catch (error) {
        console.error('transferWorkspaceOwnership Error:', error);
        res.status(500).json({ message: "Server Error" });
    }
};
