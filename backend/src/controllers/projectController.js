import Project from '../models/Project.js';
import Workspace from '../models/Workspace.js';
import List from '../models/List.js';


export const createProject = async (req, res) => {
    try {
        const { name, description, workspaceId, status, startDate, dueDate, tags = [], members = [] } = req.body;

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

        // Sanitize members to include only existing workspace users
        const workspaceMemberIds = workspace.members.map((m) => m.user.toString());
        const sanitizedMembers = Array.isArray(members)
            ? members
                  .filter((m) => m?.user && workspaceMemberIds.includes(m.user.toString()))
                  .map((m) => ({
                      user: m.user,
                      role: ['Manager', 'Contributor', 'Viewer'].includes(m.role) ? m.role : 'Contributor'
                  }))
            : [];

        // Normalize tags
        const normalizedTags = Array.isArray(tags)
            ? tags
                  .map((t) => (typeof t === 'string' ? t.trim() : ''))
                  .filter(Boolean)
            : [];

        // 3. Create Project
        const project = await Project.create({
            name,
            description,
            workspace: workspaceId,
            createdBy: req.user._id,
            status: status || 'Planning',
            startDate: startDate ? new Date(startDate) : undefined,
            dueDate: dueDate ? new Date(dueDate) : undefined,
            tags: normalizedTags,
            members: sanitizedMembers
        });

        // Create default board lists
        const defaultLists = [
            { title: 'To Do', order: 0 },
            { title: 'In Progress', order: 1 },
            { title: 'Done', order: 2 }
        ];

        await List.insertMany(
            defaultLists.map((l) => ({ ...l, projectId: project._id }))
        );

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