import Project from '../models/Project.js';
import Workspace from '../models/Workspace.js';
import Notification from '../models/Notification.js';

/**
 * Check if member is admin or owner
 */
export const isAdminOrOwner = (member) => member && (member.role === 'owner' || member.role === 'admin');

/**
 * Check if user is assigned to a card
 */
export const isCardAssignee = (card, userId) =>
    (card?.assignees || []).some((id) => id.toString() === userId.toString());

/**
 * Check if user can edit a task
 */
export const canEditTask = (member, card, userId) =>
    isAdminOrOwner(member) || isCardAssignee(card, userId);

/**
 * Check if user can delete a comment
 */
export const canDeleteComment = (member, comment, userId) =>
    isAdminOrOwner(member) || comment?.author?.toString() === userId.toString();

/**
 * Get all assignable user IDs from a project
 */
export const getProjectAssignableUserIds = (project) =>
    new Set(
        (project?.members || [])
            .map((m) => (m?.user ? m.user.toString() : ''))
            .filter(Boolean)
    );

/**
 * Sanitize assignees to only include project members
 */
export const sanitizeAssigneesForProject = (assignees, project) => {
    if (!Array.isArray(assignees)) return [];
    const projectMemberIds = getProjectAssignableUserIds(project);
    return assignees
        .map((id) => id?.toString())
        .filter((id) => id && projectMemberIds.has(id));
};

/**
 * Append activity log entry to a card
 */
export const appendActivity = (card, { type, message, actor }) => {
    if (!card) return;
    if (!card.activity) card.activity = [];
    card.activity.push({
        type,
        message,
        actor,
    });
    if (card.activity.length > 200) {
        card.activity = card.activity.slice(-200);
    }
};

/**
 * Get project context with authorization check
 */
export const getProjectContext = async (projectId, userId) => {
    if (!projectId) {
        return { status: 400, message: 'projectId is required' };
    }
    const project = await Project.findById(projectId).select('workspace members');
    if (!project) {
        return { status: 404, message: 'Project not found' };
    }
    const workspace = await Workspace.findById(project.workspace);
    if (!workspace) {
        return { status: 404, message: 'Workspace not found' };
    }
    const member = workspace.members.find(
        (m) => m.user.toString() === userId.toString()
    );
    if (!member) {
        return { status: 403, message: 'Not authorized' };
    }
    return { status: 200, project, workspace, member };
};

/**
 * Emit workspace socket event
 */
export const emitWorkspaceEvent = (req, workspaceId, eventName, payload) => {
    if (!workspaceId) return;
    const io = req.app.get('io');
    const room = `workspace_${workspaceId.toString()}`;
    io?.to(room).emit(eventName, {
        workspaceId: workspaceId.toString(),
        ...payload,
    });
};

/**
 * Emit task changed event (combines task_updated + project_updated)
 */
export const emitTaskChanged = (req, context, card, action = 'task_updated') => {
    emitWorkspaceEvent(req, context.workspace._id, 'task_updated', {
        task: card,
    });
    emitWorkspaceEvent(req, context.workspace._id, 'project_updated', {
        project: { _id: card.projectId.toString() },
        action,
    });
};

/**
 * Create notifications for newly assigned users
 */
export const createAssigneeNotifications = async (card, newAssignees, actor, req) => {
    const io = req.app.get('io');
    const project = await Project.findById(card.projectId).select('workspace');
    const workspaceRoom = project?.workspace ? `workspace_${project.workspace}` : null;

    for (const userId of newAssignees) {
        const userIdStr = userId.toString();
        // Don't notify if assigning self
        if (userIdStr !== actor._id.toString()) {
            // 1. Create DB Record
            const notif = await Notification.create({
                recipient: userIdStr,
                sender: actor._id,
                message: `assigned you to task "${card.title}"`,
                type: 'assignment',
                relatedId: card._id
            });

            // 2. Send Real-time Socket Event
            if (workspaceRoom) {
                io.to(workspaceRoom).emit("new_notification", { 
                    ...notif._doc,
                    recipient: userIdStr,
                    sender: { fullname: actor.fullname } 
                });
            }
        }
    }
};
