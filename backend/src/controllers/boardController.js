import List from '../models/List.js';
import Card from '../models/Card.js';
import Project from '../models/Project.js';
import Workspace from '../models/Workspace.js';
import {
    isAdminOrOwner,
    canEditTask,
    canDeleteComment,
    sanitizeAssigneesForProject,
    appendActivity,
    getProjectContext,
    emitWorkspaceEvent,
    emitTaskChanged,
    createAssigneeNotifications,
    parseMentions,
    createMentionNotifications,
    getWorkspaceCards as getWorkspaceCardsService,
    getMyTasks as getMyTasksService,
    getWorkspaceStats as getWorkspaceStatsService,
} from '../services/boardService.js';
import { calculateWorkspaceAnalytics } from '../services/analyticsService.js';
import { canAccessWorkspaceAnalytics } from '../services/workspacePlanService.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const getNextListOrder = async (projectId) => {
    const last = await List.findOne({ projectId }).sort('-order');
    return last ? last.order + 1 : 0;
};

const getNextCardOrder = async (listId) => {
    const last = await Card.findOne({ listId }).sort('-order');
    return last ? last.order + 1 : 0;
};

// GET /api/board/:projectId
export const getBoard = asyncHandler(async (req, res) => {
    const { projectId } = req.params;
    const context = await getProjectContext(projectId, req.user._id);
    if (context.status !== 200) {
        return res.status(context.status).json({ message: context.message });
    }

    const lists = await List.find({ projectId }).sort('order');
    const cards = await Card.find({ projectId, archived: { $ne: true } })
        .sort('order')
        .populate('assignees', 'fullname avatar')
        .populate('comments.author', 'fullname avatar');

    res.json({ lists, cards });
});

// POST /api/board/list
export const createList = asyncHandler(async (req, res) => {
    const { title, projectId } = req.body;
    const context = await getProjectContext(projectId, req.user._id);
    if (context.status !== 200) {
        return res.status(context.status).json({ message: context.message });
    }
    if (!isAdminOrOwner(context.member)) {
        return res.status(403).json({ message: 'Only admins can create lists' });
    }

    const newOrder = await getNextListOrder(projectId);
    const list = await List.create({ title, projectId, order: newOrder });

    emitWorkspaceEvent(req, context.workspace._id, 'list_created', { list });
    res.status(201).json(list);
});

// POST /api/board/card
export const createCard = asyncHandler(async (req, res) => {
    const { title, listId, projectId, description, dueDate, assignees = [], priority } = req.body;
    const context = await getProjectContext(projectId, req.user._id);
    if (context.status !== 200) {
        return res.status(context.status).json({ message: context.message });
    }

    const list = await List.findById(listId).select('projectId');
    if (!list || list.projectId.toString() !== projectId.toString()) {
        return res.status(400).json({ message: 'List does not belong to this project' });
    }

    let sanitizedAssignees = sanitizeAssigneesForProject(assignees, context.project);
    if (!isAdminOrOwner(context.member)) {
        const selfId = req.user._id.toString();
        const selfOnly = sanitizedAssignees.filter((id) => id.toString() === selfId);
        sanitizedAssignees = selfOnly.length ? selfOnly : [];
    }

    const newOrder = await getNextCardOrder(listId);
    const card = await Card.create({
        title,
        listId,
        projectId,
        order: newOrder,
        description: description || '',
        dueDate: dueDate ? new Date(dueDate) : undefined,
        assignees: sanitizedAssignees,
        priority: ['Low', 'Medium', 'High'].includes(priority) ? priority : 'Medium',
    });

    appendActivity(card, {
        type: 'task_created',
        message: `${req.user?.fullname || 'Someone'} created this task`,
        actor: req.user._id,
    });
    await card.save();
    await card.populate('assignees', 'fullname avatar');

    emitWorkspaceEvent(req, context.workspace._id, 'task_created', { task: card });
    emitWorkspaceEvent(req, context.workspace._id, 'project_updated', {
        project: { _id: projectId.toString() },
        action: 'task_created',
    });
    res.status(201).json(card);
});

// PUT /api/board/card/order
export const updateCardOrder = asyncHandler(async (req, res) => {
    const { cardId, newListId, newOrder } = req.body;
    const card = await Card.findById(cardId);
    if (!card) return res.status(404).json({ message: 'Card not found' });

    const context = await getProjectContext(card.projectId, req.user._id);
    if (context.status !== 200) {
        return res.status(context.status).json({ message: context.message });
    }

    const isAssigned = card.assignees.some(
        (id) => id.toString() === req.user._id.toString()
    );
    if (!isAdminOrOwner(context.member) && !isAssigned) {
        return res.status(403).json({ message: 'Not authorized to move this task' });
    }

    const list = await List.findById(newListId).select('projectId');
    if (!list || list.projectId.toString() !== card.projectId.toString()) {
        return res.status(400).json({ message: 'List does not belong to this project' });
    }

    const previousListId = card.listId?.toString();
    await Card.findByIdAndUpdate(cardId, { listId: newListId, order: newOrder });

    emitWorkspaceEvent(req, context.workspace._id, 'task_moved', {
        task: {
            _id: cardId.toString(),
            projectId: card.projectId.toString(),
            listId: newListId.toString(),
            previousListId,
            order: newOrder,
        },
    });
    emitWorkspaceEvent(req, context.workspace._id, 'project_updated', {
        project: { _id: card.projectId.toString() },
        action: 'task_moved',
    });

    res.json({ message: 'Order updated' });
});

// DELETE /api/board/card/:id
export const deleteCard = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const card = await Card.findById(id);
    if (!card) return res.status(404).json({ message: 'Card not found' });

    const context = await getProjectContext(card.projectId, req.user._id);
    if (context.status !== 200) {
        return res.status(context.status).json({ message: context.message });
    }
    if (!isAdminOrOwner(context.member)) {
        return res.status(403).json({ message: 'Only admins can delete tasks' });
    }

    await card.deleteOne();
    emitWorkspaceEvent(req, context.workspace._id, 'task_deleted', {
        task: {
            _id: card._id.toString(),
            projectId: card.projectId.toString(),
            listId: card.listId?.toString(),
        },
    });
    emitWorkspaceEvent(req, context.workspace._id, 'project_updated', {
        project: { _id: card.projectId.toString() },
        action: 'task_deleted',
    });
    res.json({ message: 'Card deleted' });
});

// PUT /api/board/card/:id
export const updateCard = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { title, description, dueDate, assignees, priority } = req.body;

    const card = await Card.findById(id);
    if (!card) return res.status(404).json({ message: 'Card not found' });

    const context = await getProjectContext(card.projectId, req.user._id);
    if (context.status !== 200) {
        return res.status(context.status).json({ message: context.message });
    }
    if (!canEditTask(context.member, card, req.user._id)) {
        return res.status(403).json({ message: 'Not authorized to edit this task' });
    }
    if (assignees !== undefined && !isAdminOrOwner(context.member)) {
        return res.status(403).json({ message: 'Only admins can change assignees' });
    }

    if (title !== undefined) {
        const trimmed = String(title || '').trim();
        if (!trimmed) return res.status(400).json({ message: 'Title is required' });
        if (trimmed !== card.title) {
            card.title = trimmed;
            appendActivity(card, {
                type: 'title_updated',
                message: `${req.user?.fullname || 'Someone'} updated the title`,
                actor: req.user._id,
            });
        }
    }
    if (description !== undefined && description !== card.description) {
        card.description = description;
        appendActivity(card, {
            type: 'description_updated',
            message: `${req.user?.fullname || 'Someone'} updated the description`,
            actor: req.user._id,
        });
    }
    if (dueDate !== undefined) {
        const nextDueDate = dueDate ? new Date(dueDate) : undefined;
        const prev = card.dueDate ? new Date(card.dueDate).toISOString() : '';
        const next = nextDueDate ? nextDueDate.toISOString() : '';
        if (prev !== next) {
            card.dueDate = nextDueDate;
            appendActivity(card, {
                type: 'due_date_updated',
                message: `${req.user?.fullname || 'Someone'} updated the due date`,
                actor: req.user._id,
            });
        }
    }
    if (
        priority !== undefined &&
        ['Low', 'Medium', 'High'].includes(priority) &&
        priority !== card.priority
    ) {
        card.priority = priority;
        appendActivity(card, {
            type: 'priority_updated',
            message: `${req.user?.fullname || 'Someone'} changed priority to ${priority}`,
            actor: req.user._id,
        });
    }

    if (assignees !== undefined) {
        const newAssignees = Array.isArray(assignees) ? assignees : JSON.parse(assignees);
        const sanitizedAssignees = sanitizeAssigneesForProject(newAssignees, context.project);
        const previousAssignees = card.assignees.map((id) => id.toString());
        const addedUsers = sanitizedAssignees.filter(
            (id) => !previousAssignees.includes(id.toString())
        );
        card.assignees = sanitizedAssignees;
        appendActivity(card, {
            type: 'assignees_updated',
            message: `${req.user?.fullname || 'Someone'} updated assignees`,
            actor: req.user._id,
        });
        if (addedUsers.length > 0) {
            await createAssigneeNotifications(card, addedUsers, req.user, req);
        }
    }

    if (req.file) {
        if (!card.attachments) card.attachments = [];
        card.attachments.push(req.file.path);
        appendActivity(card, {
            type: 'attachment_added',
            message: `${req.user?.fullname || 'Someone'} added an attachment`,
            actor: req.user._id,
        });
    }

    await card.save();
    await card.populate('assignees', 'fullname avatar');
    await card.populate('comments.author', 'fullname avatar');
    emitTaskChanged(req, context, card, 'task_updated');

    res.json(card);
});

// POST /api/board/card/:id/comment
export const addCardComment = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const content = String(req.body?.content || '').trim();
    if (!content) return res.status(400).json({ message: 'Comment content is required' });

    const card = await Card.findById(id);
    if (!card || card.archived) return res.status(404).json({ message: 'Card not found' });

    const context = await getProjectContext(card.projectId, req.user._id);
    if (context.status !== 200) {
        return res.status(context.status).json({ message: context.message });
    }

    card.comments.push({ author: req.user._id, content });
    appendActivity(card, {
        type: 'comment_added',
        message: `${req.user?.fullname || 'Someone'} added a comment`,
        actor: req.user._id,
    });

    await card.save();
    await card.populate('comments.author', 'fullname avatar');
    const comment = card.comments[card.comments.length - 1];

    try {
        const project = await Project.findById(card.projectId).populate('members.user', 'fullname');
        const mentionedUserIds = parseMentions(content, project?.members || []);
        if (mentionedUserIds.length > 0) {
            await createMentionNotifications(card, mentionedUserIds, req.user, content, req);
        }
    } catch (mentionErr) {
        console.error('Mention notification error:', mentionErr);
    }

    emitTaskChanged(req, context, card, 'task_commented');
    res.status(201).json({ comment });
});

// DELETE /api/board/card/:id/comment/:commentId
export const deleteCardComment = asyncHandler(async (req, res) => {
    const { id, commentId } = req.params;
    const card = await Card.findById(id);
    if (!card || card.archived) return res.status(404).json({ message: 'Card not found' });

    const context = await getProjectContext(card.projectId, req.user._id);
    if (context.status !== 200) {
        return res.status(context.status).json({ message: context.message });
    }

    const comment = card.comments.id(commentId);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });
    if (!canDeleteComment(context.member, comment, req.user._id)) {
        return res.status(403).json({ message: 'Not authorized to delete this comment' });
    }

    card.comments.pull(commentId);
    appendActivity(card, {
        type: 'comment_deleted',
        message: `${req.user?.fullname || 'Someone'} deleted a comment`,
        actor: req.user._id,
    });

    await card.save();
    emitTaskChanged(req, context, card, 'task_comment_deleted');
    res.json({ message: 'Comment deleted' });
});

// POST /api/board/card/:id/subtask
export const addCardSubtask = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const text = String(req.body?.text || '').trim();
    if (!text) return res.status(400).json({ message: 'Subtask text is required' });

    const card = await Card.findById(id);
    if (!card || card.archived) return res.status(404).json({ message: 'Card not found' });

    const context = await getProjectContext(card.projectId, req.user._id);
    if (context.status !== 200) {
        return res.status(context.status).json({ message: context.message });
    }
    if (!canEditTask(context.member, card, req.user._id)) {
        return res.status(403).json({ message: 'Not authorized to edit this task' });
    }

    card.subtasks.push({ text, done: false, createdBy: req.user._id });
    appendActivity(card, {
        type: 'subtask_added',
        message: `${req.user?.fullname || 'Someone'} added a subtask`,
        actor: req.user._id,
    });

    await card.save();
    const subtask = card.subtasks[card.subtasks.length - 1];
    emitTaskChanged(req, context, card, 'task_subtask_added');
    res.status(201).json({ subtask });
});

// PATCH /api/board/card/:id/subtask/:subtaskId
export const toggleCardSubtask = asyncHandler(async (req, res) => {
    const { id, subtaskId } = req.params;
    const { done } = req.body || {};

    const card = await Card.findById(id);
    if (!card || card.archived) return res.status(404).json({ message: 'Card not found' });

    const context = await getProjectContext(card.projectId, req.user._id);
    if (context.status !== 200) {
        return res.status(context.status).json({ message: context.message });
    }
    if (!canEditTask(context.member, card, req.user._id)) {
        return res.status(403).json({ message: 'Not authorized to edit this task' });
    }

    const subtask = card.subtasks.id(subtaskId);
    if (!subtask) return res.status(404).json({ message: 'Subtask not found' });

    const nextDone = typeof done === 'boolean' ? done : !subtask.done;
    if (subtask.done !== nextDone) {
        subtask.done = nextDone;
        appendActivity(card, {
            type: 'subtask_toggled',
            message: `${req.user?.fullname || 'Someone'} ${nextDone ? 'completed' : 'reopened'} a subtask`,
            actor: req.user._id,
        });
        await card.save();
        emitTaskChanged(req, context, card, 'task_subtask_toggled');
    }

    res.json({ subtask });
});

// DELETE /api/board/card/:id/subtask/:subtaskId
export const deleteCardSubtask = asyncHandler(async (req, res) => {
    const { id, subtaskId } = req.params;

    const card = await Card.findById(id);
    if (!card || card.archived) return res.status(404).json({ message: 'Card not found' });

    const context = await getProjectContext(card.projectId, req.user._id);
    if (context.status !== 200) {
        return res.status(context.status).json({ message: context.message });
    }
    if (!canEditTask(context.member, card, req.user._id)) {
        return res.status(403).json({ message: 'Not authorized to edit this task' });
    }

    const subtask = card.subtasks.id(subtaskId);
    if (!subtask) return res.status(404).json({ message: 'Subtask not found' });

    card.subtasks.pull(subtaskId);
    appendActivity(card, {
        type: 'subtask_deleted',
        message: `${req.user?.fullname || 'Someone'} deleted a subtask`,
        actor: req.user._id,
    });

    await card.save();
    emitTaskChanged(req, context, card, 'task_subtask_deleted');
    res.json({ message: 'Subtask deleted' });
});

// PATCH /api/board/card/:id/archive
export const archiveCard = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { archived } = req.body || {};

    const card = await Card.findById(id);
    if (!card) return res.status(404).json({ message: 'Card not found' });

    const context = await getProjectContext(card.projectId, req.user._id);
    if (context.status !== 200) {
        return res.status(context.status).json({ message: context.message });
    }
    if (!isAdminOrOwner(context.member)) {
        return res.status(403).json({ message: 'Only admins can archive tasks' });
    }

    const nextArchived = typeof archived === 'boolean' ? archived : !card.archived;
    if (card.archived !== nextArchived) {
        card.archived = nextArchived;
        appendActivity(card, {
            type: nextArchived ? 'task_archived' : 'task_unarchived',
            message: `${req.user?.fullname || 'Someone'} ${nextArchived ? 'archived' : 'unarchived'} this task`,
            actor: req.user._id,
        });
        await card.save();
        emitTaskChanged(req, context, card, nextArchived ? 'task_archived' : 'task_unarchived');
    }

    res.json(card);
});

// GET /api/board/cards?workspaceId=...
export const getWorkspaceCards = asyncHandler(async (req, res) => {
    const { workspaceId } = req.query;
    if (!workspaceId) {
        const err = new Error('workspaceId is required');
        err.statusCode = 400;
        throw err;
    }
    const cards = await getWorkspaceCardsService(workspaceId, req.user._id);
    res.json(cards);
});

// GET /api/board/my-tasks?workspaceId=...
export const getMyTasks = asyncHandler(async (req, res) => {
    const { workspaceId } = req.query;
    if (!workspaceId) {
        const err = new Error('workspaceId is required');
        err.statusCode = 400;
        throw err;
    }
    const cards = await getMyTasksService(workspaceId, req.user._id);
    res.json(cards);
});

// GET /api/board/stats?workspaceId=...
export const getWorkspaceStats = asyncHandler(async (req, res) => {
    const { workspaceId } = req.query;
    if (!workspaceId) {
        const err = new Error('workspaceId is required');
        err.statusCode = 400;
        throw err;
    }
    const stats = await getWorkspaceStatsService(workspaceId, req.user._id);
    res.json(stats);
});

// GET /api/board/analytics?workspaceId=...
export const getWorkspaceAnalytics = asyncHandler(async (req, res) => {
    const { workspaceId, days = '30' } = req.query;
    if (!workspaceId) {
        const err = new Error('workspaceId is required');
        err.statusCode = 400;
        throw err;
    }

    const workspace = await Workspace.findById(workspaceId).populate(
        'members.user',
        'fullname avatar email'
    );
    if (!workspace) return res.status(404).json({ message: 'Workspace not found' });

    const member = workspace.members.find((m) => {
        const uid = m.user?._id || m.user;
        return uid.toString() === req.user._id.toString();
    });
    if (!member) {
        return res.status(403).json({ message: 'Not authorized to view this workspace' });
    }
    if (!isAdminOrOwner(member)) {
        return res.status(403).json({
            code: 'ANALYTICS_ROLE_FORBIDDEN',
            message: 'Analytics is available to workspace owners and admins only.',
        });
    }
    if (!canAccessWorkspaceAnalytics(workspace)) {
        return res.status(403).json({
            code: 'ANALYTICS_PRO_REQUIRED',
            message: 'Analytics is available only for Pro workspaces.',
        });
    }

    const daysNum = parseInt(days, 10) || 30;
    const analytics = await calculateWorkspaceAnalytics(workspaceId, daysNum, workspace);
    res.json(analytics);
});
