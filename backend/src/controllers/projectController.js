import Project from '../models/Project.js';
import Workspace from '../models/Workspace.js';
import List from '../models/List.js';


export const createProject = async (req, res) => {
    try {
        const {
            name,
            description,
            workspaceId,
            status,
            startDate,
            dueDate,
            tags = [],
            members = [],
            projectColor,
            calendarEnabled
        } = req.body;

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

        const safeProjectColor =
            typeof projectColor === 'string' && /^#(?:[0-9a-fA-F]{3}){1,2}$/.test(projectColor.trim())
                ? projectColor.trim()
                : undefined;
        const safeCalendarEnabled =
            typeof calendarEnabled === 'boolean' ? calendarEnabled : undefined;

        // 3. Create Project
        const project = await Project.create({
            name,
            description,
            workspace: workspaceId,
            createdBy: req.user._id,
            status: status || 'Planning',
            startDate: startDate ? new Date(startDate) : undefined,
            dueDate: dueDate ? new Date(dueDate) : undefined,
            projectColor: safeProjectColor,
            calendarEnabled: safeCalendarEnabled,
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

export const getProjectsByWorkspace = async (req, res) => {
    try {
        const { workspaceId } = req.query;

        if (!workspaceId) {
            return res.status(400).json({ message: "workspaceId is required" });
        }

        const workspace = await Workspace.findById(workspaceId);
        if (!workspace) {
            return res.status(404).json({ message: "Workspace not found" });
        }

        const isMember = workspace.members.some(m => m.user.toString() === req.user._id.toString());
        if (!isMember) {
            return res.status(403).json({ message: "Not authorized to view projects for this workspace" });
        }

        const projects = await Project.find({ workspace: workspaceId })
            .sort({ createdAt: -1 })
            .populate('members.user', 'fullname email avatar');

        res.json(projects);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error" });
    }
};

export const getProjectById = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id)
            .populate('members.user', 'fullname email avatar');

        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        }

        const workspace = await Workspace.findById(project.workspace);
        if (!workspace) {
            return res.status(404).json({ message: "Workspace not found" });
        }

        const isMember = workspace.members.some(
            (m) => m.user.toString() === req.user._id.toString()
        );
        if (!isMember) {
            return res.status(403).json({ message: "Not authorized to view this project" });
        }

        res.json(project);
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

        // Check: Are you a Workspace Owner or Admin?
        const workspace = await Workspace.findById(project.workspace);
        const member = workspace.members.find(m => m.user.toString() === req.user._id.toString());
        const isAdminOrOwner = member && (member.role === 'owner' || member.role === 'admin');

        // Allow delete if admin/owner
        if (isAdminOrOwner) {
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
