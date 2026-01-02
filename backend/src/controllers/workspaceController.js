import Workspace from '../models/Workspace.js';
import Project from '../models/Project.js';
import Channel from '../models/Channel.js';


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
