import Workspace from '../models/Workspace.js';
import Project from '../models/Project.js';
import Channel from '../models/Channel.js';
import User from '../models/User.js';


export const createWorkspace = async (req, res) => {
    try {
        const { name, description } = req.body;

        // 1. Create Workspace
        const workspace = await Workspace.create({
            name,
            description,
            members: [{ user: req.user._id, role: 'owner' }]
        });

        // 2. Automatically create a "General" channel 
        await Channel.create({
            name: 'general',
            workspace: workspace._id,
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

        // 2. Check if user is a member (Security)
        const isMember = workspace.members.some(m => m.user._id.toString() === req.user._id.toString());
        if (!isMember) {
            return res.status(403).json({ message: "Not authorized to view this workspace" });
        }

        // 3. Fetch Channels and Projects belonging to this workspace
        const projects = await Project.find({ workspace: workspaceId }).sort({ createdAt: -1 });
        const channels = await Channel.find({ workspace: workspaceId }).sort({ name: 1 });

        res.json({
            workspace,
            projects,
            channels
        });

    } catch (error) {
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

        res.json({ message: `${userToInvite.fullname} added to workspace!` });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error" });
    }
};