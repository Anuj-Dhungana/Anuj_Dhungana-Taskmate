import Project from '../models/Project.js';
import Workspace from '../models/Workspace.js';


export const createProject = async (req, res) => {
    try {
        const { name, description, workspaceId } = req.body;

        // 1. Verify Workspace exists
        const workspace = await Workspace.findById(workspaceId);
        if (!workspace) {
            return res.status(404).json({ message: "Workspace not found" });
        }

        // 2. Check if user is a member of this workspace
        const isMember = workspace.members.some(m => m.user.toString() === req.user._id.toString());
        if (!isMember) {
            return res.status(403).json({ message: "You are not a member of this workspace" });
        }

        // 3. Create Project
        const project = await Project.create({
            name,
            description,
            workspace: workspaceId,
            createdBy: req.user._id
        });

        res.status(201).json(project);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error" });
    }
};



export const deleteProject = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        
        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        }

        // Check 1: Are you the person who created this project?
        const isCreator = project.createdBy.toString() === req.user._id.toString();

        // Check 2: Are you a Workspace Owner or Admin?
        // We need to fetch the workspace to check your role
        const workspace = await Workspace.findById(project.workspace);
        const member = workspace.members.find(m => m.user.toString() === req.user._id.toString());
        const isAdminOrOwner = member && (member.role === 'owner' || member.role === 'admin');

        // Allow delete if either condition is true
        if (isCreator || isAdminOrOwner) {
            await project.deleteOne();
        

            return res.json({ message: "Project deleted successfully" });
        } else {
            return res.status(403).json({ message: "Not authorized to delete this project" });
        }

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error" });
    }
};