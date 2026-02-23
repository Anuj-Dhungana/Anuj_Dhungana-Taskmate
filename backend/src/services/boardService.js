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
 * Parse @mentions from comment content and return matched user IDs.
 * Finds every '@' in the content and checks if the text following it
 * starts with a known project member's fullname (case-insensitive).
 */
export const parseMentions = (content, projectMembers = []) => {
    if (!content || !projectMembers.length) return [];

    // Build a lookup of lowercase fullname → userId
    const memberLookup = [];
    for (const member of projectMembers) {
        const user = member?.user || member;
        const userId = user?._id?.toString() || user?.toString();
        const fullname = (user?.fullname || '').trim();
        if (!fullname || !userId) continue;
        memberLookup.push({ fullname, fullnameLower: fullname.toLowerCase(), userId });
    }
    if (memberLookup.length === 0) return [];

    // Sort by longest name first so "John Doe Smith" matches before "John Doe"
    memberLookup.sort((a, b) => b.fullnameLower.length - a.fullnameLower.length);

    const matchedUserIds = new Set();
    const contentLower = content.toLowerCase();

    // Find every '@' in the content
    let atIndex = contentLower.indexOf('@');
    while (atIndex !== -1) {
        const afterAt = contentLower.slice(atIndex + 1);
        // Check if the text after '@' starts with any member's fullname
        for (const { fullnameLower, userId } of memberLookup) {
            if (afterAt.startsWith(fullnameLower)) {
                // Ensure the name ends at a word boundary (space, punctuation, or end of string)
                const charAfterName = afterAt[fullnameLower.length];
                if (!charAfterName || /[\s,.:;!?)}\]]/.test(charAfterName)) {
                    matchedUserIds.add(userId);
                    break; // longest match wins for this position
                }
            }
        }
        atIndex = contentLower.indexOf('@', atIndex + 1);
    }

    return [...matchedUserIds];
};

/**
 * Create mention notifications for users mentioned in a comment
 */
export const createMentionNotifications = async (card, mentionedUserIds, actor, commentContent, req) => {
    const io = req.app.get('io');
    const project = await Project.findById(card.projectId).select('workspace name');
    const workspaceRoom = project?.workspace ? `workspace_${project.workspace}` : null;

    for (const userId of mentionedUserIds) {
        const userIdStr = userId.toString();
        // Don't notify self-mentions
        if (userIdStr === actor._id.toString()) continue;

        const notif = await Notification.create({
            recipient: userIdStr,
            sender: actor._id,
            message: `mentioned you in a comment on "${card.title}"`,
            type: 'mention',
            relatedId: card._id,
            taskTitle: card.title,
            commentContent: commentContent.length > 200 ? commentContent.slice(0, 200) + '...' : commentContent,
        });

        if (workspaceRoom) {
            io.to(workspaceRoom).emit('new_notification', {
                ...notif._doc,
                recipient: userIdStr,
                sender: { fullname: actor.fullname, avatar: actor.avatar },
            });
        }
    }
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
