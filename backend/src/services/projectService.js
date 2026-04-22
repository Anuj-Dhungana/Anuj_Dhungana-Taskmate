import Project from '../models/Project.js';
import Workspace from '../models/Workspace.js';
import List from '../models/List.js';
import { canCreateProjectInWorkspace } from './workspacePlanService.js';

// Helpers


/**
 * Assert that a user is a member of a workspace.
 * Throws 403 if not.
 */
export const assertWorkspaceMembership = (workspace, userId, message = 'You are not a member of this workspace') => {
    const isMember = workspace.members.some(
        (m) => m.user.toString() === userId.toString()
    );
    if (!isMember) {
        const err = new Error(message);
        err.status = 403;
        throw err;
    }
};

/**
 * Assert that a user is an admin or owner of a workspace.
 * Throws 403 if not.
 */
export const assertAdminOrOwner = (workspace, userId, message = 'Only admins can edit project settings') => {
    const member = workspace.members.find(
        (m) => m.user.toString() === userId.toString()
    );
    const isAdminOrOwner = member && (member.role === 'owner' || member.role === 'admin');
    if (!isAdminOrOwner) {
        const err = new Error(message);
        err.status = 403;
        throw err;
    }
};

/**
 * Sanitize a members array so only valid workspace members with valid roles remain.
 */
export const sanitizeProjectMembers = (members, workspace, fallback = []) => {
    if (!Array.isArray(members)) return fallback;
    const workspaceMemberIds = workspace.members.map((m) => m.user.toString());
    return members
        .filter((m) => m?.user && workspaceMemberIds.includes(m.user.toString()))
        .map((m) => ({
            user: m.user,
            role: ['Manager', 'Contributor', 'Viewer'].includes(m.role)
                ? m.role
                : 'Contributor',
        }));
};

/**
 * Normalize a tags array: trim strings, remove blanks.
 */
export const normalizeTags = (tags, fallback = []) => {
    if (!Array.isArray(tags)) return fallback;
    return tags
        .map((t) => (typeof t === 'string' ? t.trim() : ''))
        .filter(Boolean);
};

/**
 * Validate and return a safe hex color string, or undefined if invalid.
 */
export const sanitizeProjectColor = (color, fallback = undefined) => {
    if (
        typeof color === 'string' &&
        /^#(?:[0-9a-fA-F]{3}){1,2}$/.test(color.trim())
    ) {
        return color.trim();
    }
    return fallback;
};

/**
 * Create the three default Kanban lists for a new project.
 */
export const createDefaultLists = async (projectId) => {
    const defaultLists = [
        { title: 'To Do', order: 0 },
        { title: 'In Progress', order: 1 },
        { title: 'Done', order: 2 },
    ];
    await List.insertMany(defaultLists.map((l) => ({ ...l, projectId })));
};

/**
 * Emit a project-related socket event to the workspace room.
 */
export const emitProjectEvent = (req, workspaceId, eventName, payload) => {
    const io = req.app.get('io');
    const workspaceRoom = `workspace_${workspaceId}`;
    io?.to(workspaceRoom).emit(eventName, {
        workspaceId: workspaceId.toString(),
        ...payload,
    });
};


// CRUD operations


/**
 * Create a new project in a workspace.
 * Enforces plan limits, sanitizes input, creates default lists, emits events.
 */
export const createProject = async (data, userId, req) => {
    const {
        name,
        description,
        workspaceId,
        status,
        priority,
        startDate,
        dueDate,
        tags = [],
        members = [],
        projectColor,
        calendarEnabled,
    } = data;

    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
        const err = new Error('Workspace not found');
        err.status = 404;
        throw err;
    }

    assertWorkspaceMembership(workspace, userId);

    const projectAllowance = await canCreateProjectInWorkspace(workspace);
    if (!projectAllowance.allowed) {
        const err = new Error(
            `Free plan allows up to ${projectAllowance.limit} projects in this workspace. Upgrade to Pro for unlimited projects.`
        );
        err.status = 403;
        err.code = 'PROJECT_LIMIT_REACHED';
        err.limit = projectAllowance.limit;
        err.currentCount = projectAllowance.projectCount;
        throw err;
    }

    const sanitizedMembers = sanitizeProjectMembers(members, workspace);
    const normalizedTags = normalizeTags(tags);
    const safeProjectColor = sanitizeProjectColor(projectColor);
    const safeCalendarEnabled = typeof calendarEnabled === 'boolean' ? calendarEnabled : undefined;
    const safePriority = ['Low', 'Medium', 'High'].includes(priority) ? priority : 'Medium';

    const project = await Project.create({
        name,
        description,
        workspace: workspaceId,
        createdBy: userId,
        status: status || 'Planning',
        priority: safePriority,
        startDate: startDate ? new Date(startDate) : undefined,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        projectColor: safeProjectColor,
        calendarEnabled: safeCalendarEnabled,
        tags: normalizedTags,
        members: sanitizedMembers,
    });

    await createDefaultLists(project._id);

    emitProjectEvent(req, workspaceId, 'project_created', { project });
    emitProjectEvent(req, workspaceId, 'project_updated', { project, action: 'created' });

    return project;
};

/**
 * Get all projects belonging to a workspace, with member details populated.
 */
export const getProjectsByWorkspace = async (workspaceId, userId) => {
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
        const err = new Error('Workspace not found');
        err.status = 404;
        throw err;
    }
    assertWorkspaceMembership(workspace, userId, 'Not authorized to view projects for this workspace');

    return Project.find({ workspace: workspaceId })
        .sort({ createdAt: -1 })
        .populate('members.user', 'fullname email avatar');
};

/**
 * Get a single project by ID, verifying the user is a workspace member.
 */
export const getProjectById = async (projectId, userId) => {
    const project = await Project.findById(projectId)
        .populate('members.user', 'fullname email avatar');
    if (!project) {
        const err = new Error('Project not found');
        err.status = 404;
        throw err;
    }

    const workspace = await Workspace.findById(project.workspace);
    if (!workspace) {
        const err = new Error('Workspace not found');
        err.status = 404;
        throw err;
    }

    assertWorkspaceMembership(workspace, userId);
    return project;
};

/**
 * Update a project. Only workspace admins/owners may do this.
 */
export const updateProject = async (projectId, data, userId, req) => {
    const project = await Project.findById(projectId);
    if (!project) {
        const err = new Error('Project not found');
        err.status = 404;
        throw err;
    }

    const workspace = await Workspace.findById(project.workspace);
    if (!workspace) {
        const err = new Error('Workspace not found');
        err.status = 404;
        throw err;
    }

    assertAdminOrOwner(workspace, userId);

    const {
        name,
        description,
        status,
        startDate,
        dueDate,
        tags,
        members,
        projectColor,
        calendarEnabled,
        priority,
    } = data;

    if (name !== undefined) project.name = name.trim();
    if (description !== undefined) project.description = description.trim();
    if (status !== undefined) project.status = status;
    project.priority = ['Low', 'Medium', 'High'].includes(priority)
        ? priority
        : project.priority || 'Medium';
    if (startDate !== undefined)
        project.startDate = startDate ? new Date(startDate) : undefined;
    if (dueDate !== undefined)
        project.dueDate = dueDate ? new Date(dueDate) : undefined;
    project.tags = normalizeTags(tags, project.tags);
    project.members = sanitizeProjectMembers(members, workspace, project.members);
    project.projectColor = sanitizeProjectColor(projectColor, project.projectColor);
    project.calendarEnabled =
        typeof calendarEnabled === 'boolean' ? calendarEnabled : project.calendarEnabled;

    await project.save();

    const updatedProject = await Project.findById(projectId).populate(
        'members.user',
        'fullname email avatar'
    );

    emitProjectEvent(req, workspace._id.toString(), 'project_updated', {
        project: updatedProject,
        action: 'updated',
    });

    return updatedProject;
};

/**
 * Delete a project. Only workspace admins/owners may do this.
 */
export const deleteProject = async (projectId, userId, req) => {
    const project = await Project.findById(projectId);
    if (!project) {
        const err = new Error('Project not found');
        err.status = 404;
        throw err;
    }

    const workspace = await Workspace.findById(project.workspace);
    if (!workspace) {
        const err = new Error('Workspace not found');
        err.status = 404;
        throw err;
    }

    assertAdminOrOwner(workspace, userId, 'Not authorized to delete this project');

    const workspaceId = project.workspace?.toString();
    const deletedProjectId = project._id?.toString();

    await project.deleteOne();

    emitProjectEvent(req, workspaceId, 'project_deleted', {
        project: { _id: deletedProjectId },
    });
    emitProjectEvent(req, workspaceId, 'project_updated', {
        project: { _id: deletedProjectId },
        action: 'deleted',
    });
};
