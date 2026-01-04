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

        // Security: Check if user is allowed to delete (Only Creator or Workspace Admin)
        // For simplicity in FYP we'll allow the Creator to delete it.
        if (project.createdBy.toString() !== req.user._id.toString()) {
             return res.status(403).json({ message: "Only the project creator can delete this" });
        }

        await project.deleteOne();
        res.json({ message: "Project deleted successfully" });

    } catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
};