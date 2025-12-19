import Workspace from '../models/Workspace.js';

// @desc    Create a new workspace
// @route   POST /api/workspaces
// @access  Private
export const createWorkspace = async (req, res) => {
    try {
        const { name, description } = req.body;

        const workspace = await Workspace.create({
            name,
            description,
            members: [{ user: req.user._id, role: 'owner' }] // Creator is Owner
        });

        res.status(201).json(workspace);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get all workspaces for current user
// @route   GET /api/workspaces
// @access  Private
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