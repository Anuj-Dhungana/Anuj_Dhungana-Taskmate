import List from '../models/List.js';
import Card from '../models/Card.js';
import Project from '../models/Project.js';
import Notification from '../models/Notification.js';
import Workspace from '../models/Workspace.js';
import Message from '../models/Message.js';

const isAdminOrOwner = (member) => member && (member.role === 'owner' || member.role === 'admin');
const isCardAssignee = (card, userId) =>
    (card?.assignees || []).some((id) => id.toString() === userId.toString());
const canEditTask = (member, card, userId) =>
    isAdminOrOwner(member) || isCardAssignee(card, userId);
const canDeleteComment = (member, comment, userId) =>
    isAdminOrOwner(member) || comment?.author?.toString() === userId.toString();

const getProjectAssignableUserIds = (project) =>
    new Set(
        (project?.members || [])
            .map((m) => (m?.user ? m.user.toString() : ''))
            .filter(Boolean)
    );

const sanitizeAssigneesForProject = (assignees, project) => {
    if (!Array.isArray(assignees)) return [];
    const projectMemberIds = getProjectAssignableUserIds(project);
    return assignees
        .map((id) => id?.toString())
        .filter((id) => id && projectMemberIds.has(id));
};

const appendActivity = (card, { type, message, actor }) => {
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

const emitTaskChanged = (req, context, card, action = 'task_updated') => {
    emitWorkspaceEvent(req, context.workspace._id, 'task_updated', {
        task: card,
    });
    emitWorkspaceEvent(req, context.workspace._id, 'project_updated', {
        project: { _id: card.projectId.toString() },
        action,
    });
};

const getProjectContext = async (projectId, userId) => {
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

const emitWorkspaceEvent = (req, workspaceId, eventName, payload) => {
    if (!workspaceId) return;
    const io = req.app.get('io');
    const room = `workspace_${workspaceId.toString()}`;
    io?.to(room).emit(eventName, {
        workspaceId: workspaceId.toString(),
        ...payload,
    });
};


export const getBoard = async (req, res) => {
    try {
        const { projectId } = req.params;

        const context = await getProjectContext(projectId, req.user._id);
        if (context.status !== 200) {
            return res.status(context.status).json({ message: context.message });
        }

        // 1. Fetch Lists (Sorted by order)
        const lists = await List.find({ projectId }).sort('order');
        
        // 2. Fetch Cards (Sorted by order)
        const cards = await Card.find({ projectId, archived: { $ne: true } })
            .sort('order')
            .populate('assignees', 'fullname avatar')
            .populate('comments.author', 'fullname avatar');

        res.json({ lists, cards });
    } catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
};


export const createList = async (req, res) => {
    try {
        const { title, projectId } = req.body;

        const context = await getProjectContext(projectId, req.user._id);
        if (context.status !== 200) {
            return res.status(context.status).json({ message: context.message });
        }
        if (!isAdminOrOwner(context.member)) {
            return res.status(403).json({ message: "Only admins can create lists" });
        }
        
        // Find highest order to put this at the end
        const lastList = await List.findOne({ projectId }).sort('-order');
        const newOrder = lastList ? lastList.order + 1 : 0;

        const list = await List.create({
            title,
            projectId,
            order: newOrder
        });

        emitWorkspaceEvent(req, context.workspace._id, 'list_created', {
            list,
        });

        res.status(201).json(list);
    } catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
};


export const createCard = async (req, res) => {
    try {
        const { title, listId, projectId, description, dueDate, assignees = [], priority } = req.body;

        const context = await getProjectContext(projectId, req.user._id);
        if (context.status !== 200) {
            return res.status(context.status).json({ message: context.message });
        }

        const list = await List.findById(listId).select('projectId');
        if (!list || list.projectId.toString() !== projectId.toString()) {
            return res.status(400).json({ message: "List does not belong to this project" });
        }

        let sanitizedAssignees = sanitizeAssigneesForProject(assignees, context.project);

        if (!isAdminOrOwner(context.member)) {
            const selfId = req.user._id.toString();
            const selfOnly = sanitizedAssignees.filter((id) => id.toString() === selfId);
            sanitizedAssignees = selfOnly.length ? selfOnly : [];
        }

        // Find highest order in this list
        const lastCard = await Card.findOne({ listId }).sort('-order');
        const newOrder = lastCard ? lastCard.order + 1 : 0;

        const card = await Card.create({
            title,
            listId,
            projectId,
            order: newOrder,
            description: description || '',
            dueDate: dueDate ? new Date(dueDate) : undefined,
            assignees: sanitizedAssignees,
            priority: ['Low', 'Medium', 'High'].includes(priority) ? priority : 'Medium'
        });

        appendActivity(card, {
            type: 'task_created',
            message: `${req.user?.fullname || 'Someone'} created this task`,
            actor: req.user._id,
        });
        await card.save();

        await card.populate('assignees', 'fullname avatar');
        emitWorkspaceEvent(req, context.workspace._id, 'task_created', {
            task: card,
        });
        emitWorkspaceEvent(req, context.workspace._id, 'project_updated', {
            project: { _id: projectId.toString() },
            action: 'task_created',
        });
        res.status(201).json(card);
    } catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
};


export const updateCardOrder = async (req, res) => {
    try {
        const { cardId, newListId, newOrder } = req.body;

        const card = await Card.findById(cardId);
        if (!card) {
            return res.status(404).json({ message: "Card not found" });
        }

        const context = await getProjectContext(card.projectId, req.user._id);
        if (context.status !== 200) {
            return res.status(context.status).json({ message: context.message });
        }

        const isAssigned = card.assignees.some(
            (id) => id.toString() === req.user._id.toString()
        );
        if (!isAdminOrOwner(context.member) && !isAssigned) {
            return res.status(403).json({ message: "Not authorized to move this task" });
        }

        const list = await List.findById(newListId).select('projectId');
        if (!list || list.projectId.toString() !== card.projectId.toString()) {
            return res.status(400).json({ message: "List does not belong to this project" });
        }

        const previousListId = card.listId?.toString();
        // Update the card
        await Card.findByIdAndUpdate(cardId, {
            listId: newListId,
            order: newOrder
        });

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

        res.json({ message: "Order updated" });
    } catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
};



export const deleteCard = async (req, res) => {
    try {
        const { id } = req.params;

        const card = await Card.findById(id);
        if (!card) {
            return res.status(404).json({ message: "Card not found" });
        }

        const context = await getProjectContext(card.projectId, req.user._id);
        if (context.status !== 200) {
            return res.status(context.status).json({ message: context.message });
        }
        if (!isAdminOrOwner(context.member)) {
            return res.status(403).json({ message: "Only admins can delete tasks" });
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
        res.json({ message: "Card deleted" });
    } catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
};



export const updateCard = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, dueDate, assignees, priority } = req.body;

        // Find card
        const card = await Card.findById(id);
        if (!card) return res.status(404).json({ message: "Card not found" });

        const context = await getProjectContext(card.projectId, req.user._id);
        if (context.status !== 200) {
            return res.status(context.status).json({ message: context.message });
        }

        if (!canEditTask(context.member, card, req.user._id)) {
            return res.status(403).json({ message: "Not authorized to edit this task" });
        }

        if (assignees !== undefined && !isAdminOrOwner(context.member)) {
            return res.status(403).json({ message: "Only admins can change assignees" });
        }

        // Update Text Fields
        if (title !== undefined) {
            const trimmed = String(title || '').trim();
            if (!trimmed) {
                return res.status(400).json({ message: "Title is required" });
            }
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
        if (priority !== undefined && ['Low', 'Medium', 'High'].includes(priority) && priority !== card.priority) {
            card.priority = priority;
            appendActivity(card, {
                type: 'priority_updated',
                message: `${req.user?.fullname || 'Someone'} changed priority to ${priority}`,
                actor: req.user._id,
            });
        }
        
        // Update Assignees
        if (assignees !== undefined) {
            const newAssignees = Array.isArray(assignees) ? assignees : JSON.parse(assignees);
            const sanitizedAssignees = sanitizeAssigneesForProject(newAssignees, context.project);
            
            // Find who is NEWLY assigned
            const previousAssignees = card.assignees.map(id => id.toString());
            const addedUsers = sanitizedAssignees.filter(id => !previousAssignees.includes(id.toString()));

            card.assignees = sanitizedAssignees;
            appendActivity(card, {
                type: 'assignees_updated',
                message: `${req.user?.fullname || 'Someone'} updated assignees`,
                actor: req.user._id,
            });

            // Send Notifications to new assignees
            const io = req.app.get('io'); // Get Socket Instance

            const project = await Project.findById(card.projectId).select('workspace');
            const workspaceRoom = project?.workspace ? `workspace_${project.workspace}` : null;

            addedUsers.forEach(async (userId) => {
                const userIdStr = userId.toString();
                // Don't notify if assigning self
                if (userIdStr !== req.user._id.toString()) {
                    
                    // 1. Create DB Record
                    const notif = await Notification.create({
                        recipient: userIdStr,
                        sender: req.user._id,
                        message: `assigned you to task "${card.title}"`,
                        type: 'assignment',
                        relatedId: card._id
                    });

                    // 2. Send Real-time Socket Event
                    // We emit to the user's specific room (we need to make sure frontend joins it)
                    if (workspaceRoom) {
                        io.to(workspaceRoom).emit("new_notification", { 
                        ...notif._doc,
                        recipient: userIdStr, // Frontend will filter this
                        sender: { fullname: req.user.fullname } 
                        });
                    }
                }
            });
        }

        // Handle File Upload (if a file was sent)
        if (req.file) {
            // We store the Cloudinary URL
           
            if (!card.attachments) card.attachments = [];
            card.attachments.push(req.file.path);
            appendActivity(card, {
                type: 'attachment_added',
                message: `${req.user?.fullname || 'Someone'} added an attachment`,
                actor: req.user._id,
            });
        }

        await card.save();
        
        // Populate assignees to show their names immediately on frontend
        await card.populate('assignees', 'fullname avatar');
        await card.populate('comments.author', 'fullname avatar');
        emitTaskChanged(req, context, card, 'task_updated');

        res.json(card);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error" });
    }
};

export const addCardComment = async (req, res) => {
    try {
        const { id } = req.params;
        const content = String(req.body?.content || '').trim();
        if (!content) {
            return res.status(400).json({ message: "Comment content is required" });
        }

        const card = await Card.findById(id);
        if (!card || card.archived) {
            return res.status(404).json({ message: "Card not found" });
        }

        const context = await getProjectContext(card.projectId, req.user._id);
        if (context.status !== 200) {
            return res.status(context.status).json({ message: context.message });
        }

        card.comments.push({
            author: req.user._id,
            content,
        });
        appendActivity(card, {
            type: 'comment_added',
            message: `${req.user?.fullname || 'Someone'} added a comment`,
            actor: req.user._id,
        });

        await card.save();
        await card.populate('comments.author', 'fullname avatar');
        const comment = card.comments[card.comments.length - 1];

        emitTaskChanged(req, context, card, 'task_commented');
        res.status(201).json({ comment });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error" });
    }
};

export const deleteCardComment = async (req, res) => {
    try {
        const { id, commentId } = req.params;
        const card = await Card.findById(id);
        if (!card || card.archived) {
            return res.status(404).json({ message: "Card not found" });
        }

        const context = await getProjectContext(card.projectId, req.user._id);
        if (context.status !== 200) {
            return res.status(context.status).json({ message: context.message });
        }

        const comment = card.comments.id(commentId);
        if (!comment) {
            return res.status(404).json({ message: "Comment not found" });
        }
        if (!canDeleteComment(context.member, comment, req.user._id)) {
            return res.status(403).json({ message: "Not authorized to delete this comment" });
        }

        card.comments.pull(commentId);
        appendActivity(card, {
            type: 'comment_deleted',
            message: `${req.user?.fullname || 'Someone'} deleted a comment`,
            actor: req.user._id,
        });

        await card.save();
        emitTaskChanged(req, context, card, 'task_comment_deleted');
        res.json({ message: "Comment deleted" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error" });
    }
};

export const addCardSubtask = async (req, res) => {
    try {
        const { id } = req.params;
        const text = String(req.body?.text || '').trim();
        if (!text) {
            return res.status(400).json({ message: "Subtask text is required" });
        }

        const card = await Card.findById(id);
        if (!card || card.archived) {
            return res.status(404).json({ message: "Card not found" });
        }

        const context = await getProjectContext(card.projectId, req.user._id);
        if (context.status !== 200) {
            return res.status(context.status).json({ message: context.message });
        }
        if (!canEditTask(context.member, card, req.user._id)) {
            return res.status(403).json({ message: "Not authorized to edit this task" });
        }

        card.subtasks.push({
            text,
            done: false,
            createdBy: req.user._id,
        });
        appendActivity(card, {
            type: 'subtask_added',
            message: `${req.user?.fullname || 'Someone'} added a subtask`,
            actor: req.user._id,
        });

        await card.save();
        const subtask = card.subtasks[card.subtasks.length - 1];
        emitTaskChanged(req, context, card, 'task_subtask_added');
        res.status(201).json({ subtask });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error" });
    }
};

export const toggleCardSubtask = async (req, res) => {
    try {
        const { id, subtaskId } = req.params;
        const { done } = req.body || {};

        const card = await Card.findById(id);
        if (!card || card.archived) {
            return res.status(404).json({ message: "Card not found" });
        }

        const context = await getProjectContext(card.projectId, req.user._id);
        if (context.status !== 200) {
            return res.status(context.status).json({ message: context.message });
        }
        if (!canEditTask(context.member, card, req.user._id)) {
            return res.status(403).json({ message: "Not authorized to edit this task" });
        }

        const subtask = card.subtasks.id(subtaskId);
        if (!subtask) {
            return res.status(404).json({ message: "Subtask not found" });
        }

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
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error" });
    }
};

export const deleteCardSubtask = async (req, res) => {
    try {
        const { id, subtaskId } = req.params;

        const card = await Card.findById(id);
        if (!card || card.archived) {
            return res.status(404).json({ message: "Card not found" });
        }

        const context = await getProjectContext(card.projectId, req.user._id);
        if (context.status !== 200) {
            return res.status(context.status).json({ message: context.message });
        }
        if (!canEditTask(context.member, card, req.user._id)) {
            return res.status(403).json({ message: "Not authorized to edit this task" });
        }

        const subtask = card.subtasks.id(subtaskId);
        if (!subtask) {
            return res.status(404).json({ message: "Subtask not found" });
        }

        card.subtasks.pull(subtaskId);
        appendActivity(card, {
            type: 'subtask_deleted',
            message: `${req.user?.fullname || 'Someone'} deleted a subtask`,
            actor: req.user._id,
        });

        await card.save();
        emitTaskChanged(req, context, card, 'task_subtask_deleted');
        res.json({ message: "Subtask deleted" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error" });
    }
};

export const archiveCard = async (req, res) => {
    try {
        const { id } = req.params;
        const { archived } = req.body || {};

        const card = await Card.findById(id);
        if (!card) {
            return res.status(404).json({ message: "Card not found" });
        }

        const context = await getProjectContext(card.projectId, req.user._id);
        if (context.status !== 200) {
            return res.status(context.status).json({ message: context.message });
        }
        if (!isAdminOrOwner(context.member)) {
            return res.status(403).json({ message: "Only admins can archive tasks" });
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
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error" });
    }
};

export const getWorkspaceCards = async (req, res) => {
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
            return res.status(403).json({ message: "Not authorized to view this workspace" });
        }

        const projects = await Project.find({ workspace: workspaceId }).select('_id');
        const projectIds = projects.map(p => p._id);

        const cards = await Card.find({ projectId: { $in: projectIds }, archived: { $ne: true } })
            .populate('projectId', 'name')
            .populate('listId', 'title')
            .populate('assignees', 'fullname avatar');

        res.json(cards);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error" });
    }
};

export const getMyTasks = async (req, res) => {
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
            return res.status(403).json({ message: "Not authorized to view this workspace" });
        }

        const projects = await Project.find({ workspace: workspaceId }).select('_id');
        const projectIds = projects.map(p => p._id);

        const cards = await Card.find({ 
            projectId: { $in: projectIds },
            assignees: req.user._id,
            archived: { $ne: true },
        })
            .populate('projectId', 'name')
            .populate('listId', 'title')
            .populate('assignees', 'fullname avatar');

        res.json(cards);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error" });
    }
};

export const getWorkspaceStats = async (req, res) => {
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
            return res.status(403).json({ message: "Not authorized to view this workspace" });
        }

        const projects = await Project.find({ workspace: workspaceId }).select('_id');
        const projectIds = projects.map(p => p._id);

        const lists = await List.find({ projectId: { $in: projectIds } }).select('_id title');
        const listTitleMap = new Map(lists.map(l => [l._id.toString(), (l.title || '').toLowerCase()]));

        const cards = await Card.find({ projectId: { $in: projectIds }, archived: { $ne: true } }).select('listId');
        const totalCards = cards.length;
        const completedTasks = cards.filter(c => listTitleMap.get(c.listId.toString()) === 'done').length;
        const activeTasks = totalCards - completedTasks;

        res.json({ totalCards, completedTasks, activeTasks });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error" });
    }
};

export const getWorkspaceAnalytics = async (req, res) => {
    try {
        const { workspaceId, days = '30' } = req.query;
        if (!workspaceId) {
            return res.status(400).json({ message: "workspaceId is required" });
        }

        const workspace = await Workspace.findById(workspaceId).populate('members.user', 'fullname avatar email');
        if (!workspace) {
            return res.status(404).json({ message: "Workspace not found" });
        }

        const member = workspace.members.find(m => {
            const uid = m.user?._id || m.user;
            return uid.toString() === req.user._id.toString();
        });
        if (!member) {
            return res.status(403).json({ message: "Not authorized to view this workspace" });
        }
        if (!isAdminOrOwner(member)) {
            return res.status(403).json({ message: "Only admins can access analytics" });
        }

        const daysNum = parseInt(days, 10) || 30;
        const periodStart = new Date();
        periodStart.setDate(periodStart.getDate() - daysNum);
        periodStart.setHours(0, 0, 0, 0);

        // ── Fetch core data ──
        const projects = await Project.find({ workspace: workspaceId })
            .select('name status dueDate startDate createdAt members priority')
            .sort({ createdAt: -1 });
        const projectIds = projects.map(p => p._id);

        const lists = await List.find({ projectId: { $in: projectIds } }).select('_id title projectId');
        const listTitleMap = new Map(lists.map(l => [l._id.toString(), (l.title || '').toLowerCase()]));
        const listIsDone = new Map(lists.map(l => [l._id.toString(), (l.title || '').toLowerCase() === 'done']));
        const listIsInProgress = new Map(lists.map(l => [l._id.toString(), (l.title || '').toLowerCase() === 'in progress']));

        const allCards = await Card.find({ projectId: { $in: projectIds }, archived: { $ne: true } })
            .select('title projectId listId assignees dueDate priority updatedAt createdAt')
            .populate('assignees', 'fullname avatar');

        const channels = await (async () => {
            try {
                const { default: Channel } = await import('../models/Channel.js');
                return Channel.find({ workspace: workspaceId }).select('name type members');
            } catch { return []; }
        })();

        const allMessages = await Message.find({ workspaceId, createdAt: { $gte: periodStart } })
            .select('channelId sender content createdAt')
            .populate('sender', 'fullname avatar');

        // ── KPI computed values ──
        const totalCards = allCards.length;
        const completedCards = allCards.filter(c => listIsDone.get(c.listId.toString())).length;
        const completionRate = totalCards === 0 ? 0 : Math.round((completedCards / totalCards) * 100);

        const weeksInPeriod = Math.max(1, Math.ceil(daysNum / 7));
        const cardsInPeriod = allCards.filter(c => c.createdAt >= periodStart && listIsDone.get(c.listId.toString())).length;
        const throughputWeekly = Math.round(cardsInPeriod / weeksInPeriod);

        const now = new Date();
        const overdueCards = allCards.filter(c => c.dueDate && new Date(c.dueDate) < now && !listIsDone.get(c.listId.toString()));

        const activeProjects = projects.filter(p => (p.status || '').toLowerCase() !== 'completed');
        const totalMessages = allMessages.length;

        // ── PROJECT HEALTH DATA ──

        // Velocity / throughput per week
        const velocity = [];
        for (let w = weeksInPeriod - 1; w >= 0; w--) {
            const weekStart = new Date(now);
            weekStart.setDate(weekStart.getDate() - (w + 1) * 7);
            const weekEnd = new Date(now);
            weekEnd.setDate(weekEnd.getDate() - w * 7);
            const label = weekStart.toLocaleDateString('en', { month: 'short', day: 'numeric' });
            const count = allCards.filter(c => {
                if (!listIsDone.get(c.listId.toString())) return false;
                const d = new Date(c.updatedAt);
                return d >= weekStart && d < weekEnd;
            }).length;
            velocity.push({ week: label, completed: count });
        }

        // Cumulative flow per week
        const cumulativeFlow = [];
        for (let w = weeksInPeriod - 1; w >= 0; w--) {
            const snapDate = new Date(now);
            snapDate.setDate(snapDate.getDate() - w * 7);
            const label = snapDate.toLocaleDateString('en', { month: 'short', day: 'numeric' });
            let todo = 0, inProgress = 0, done = 0;
            allCards.forEach(c => {
                if (new Date(c.createdAt) > snapDate) return;
                const lid = c.listId.toString();
                if (listIsDone.get(lid)) done++;
                else if (listIsInProgress.get(lid)) inProgress++;
                else todo++;
            });
            cumulativeFlow.push({ week: label, 'To Do': todo, 'In Progress': inProgress, 'Done': done });
        }

        // Project progress comparison
        const projectProgress = projects.map(p => {
            const pid = p._id.toString();
            const pCards = allCards.filter(c => c.projectId.toString() === pid);
            const pDone = pCards.filter(c => listIsDone.get(c.listId.toString())).length;
            const progress = pCards.length === 0 ? 0 : Math.round((pDone / pCards.length) * 100);
            return {
                _id: p._id, name: p.name, status: p.status, dueDate: p.dueDate,
                totalCards: pCards.length, doneCards: pDone, progress,
                membersCount: p.members?.length || 0
            };
        });

        // Stuck tasks (in progress for >5 days)
        const stuckTasks = allCards
            .filter(c => listIsInProgress.get(c.listId.toString()))
            .map(c => {
                const daysStuck = Math.floor((now - new Date(c.updatedAt)) / (1000 * 60 * 60 * 24));
                if (daysStuck < 3) return null;
                const project = projects.find(p => p._id.toString() === c.projectId.toString());
                return {
                    _id: c._id, title: c.title,
                    project: project?.name || 'Unknown',
                    projectId: c.projectId,
                    assignees: c.assignees || [],
                    status: 'In Progress',
                    daysStuck,
                    lastUpdated: c.updatedAt
                };
            })
            .filter(Boolean)
            .sort((a, b) => b.daysStuck - a.daysStuck);

        // ── COMMUNICATION DATA ──

        // Messages per day in period
        const messagesPerDay = {};
        const tasksCompletedPerDay = {};
        for (let d = 0; d < daysNum; d++) {
            const day = new Date(now);
            day.setDate(day.getDate() - d);
            const key = day.toISOString().slice(0, 10);
            messagesPerDay[key] = 0;
            tasksCompletedPerDay[key] = 0;
        }
        allMessages.forEach(m => {
            const key = new Date(m.createdAt).toISOString().slice(0, 10);
            if (messagesPerDay[key] !== undefined) messagesPerDay[key]++;
        });
        allCards.filter(c => listIsDone.get(c.listId.toString()) && c.updatedAt >= periodStart).forEach(c => {
            const key = new Date(c.updatedAt).toISOString().slice(0, 10);
            if (tasksCompletedPerDay[key] !== undefined) tasksCompletedPerDay[key]++;
        });

        const messagesVsTasks = Object.keys(messagesPerDay).sort().map(date => ({
            date: new Date(date).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
            messages: messagesPerDay[date],
            tasksCompleted: tasksCompletedPerDay[date] || 0
        }));

        // Messages per channel
        const channelMsgCounts = {};
        allMessages.forEach(m => {
            const cid = m.channelId?.toString() || '';
            channelMsgCounts[cid] = (channelMsgCounts[cid] || 0) + 1;
        });
        const channelArr = Array.isArray(channels) ? channels : (channels ? await channels : []);
        const channelActivity = channelArr
            .filter(ch => ch.type !== 'dm')
            .map(ch => ({
                name: ch.name,
                messages: channelMsgCounts[ch._id.toString()] || 0
            }))
            .sort((a, b) => b.messages - a.messages);

        // DM vs Channel ratio
        const dmChannelIds = new Set(channelArr.filter(ch => ch.type === 'dm').map(ch => ch._id.toString()));
        let dmCount = 0, channelCount = 0;
        allMessages.forEach(m => {
            const cid = m.channelId?.toString() || '';
            if (dmChannelIds.has(cid)) dmCount++;
            else channelCount++;
        });

        // Simple word frequency from messages (top discussion topics)
        const stopWords = new Set(['the','a','an','is','it','to','and','or','of','in','on','for','i','we','you','this','that','was','are','be','has','have','do','does','did','will','would','can','could','should','not','no','yes','just','so','but','with','from','at','by','us','me','my','its','they','them','our','your','if','then','what','when','how','all','been','more','some','any']);
        const wordCounts = {};
        const wordChannelMap = {};
        allMessages.forEach(m => {
            const words = (m.content || '').toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/);
            const cid = m.channelId?.toString() || '';
            const chName = channelArr.find(ch => ch._id.toString() === cid)?.name || 'unknown';
            words.forEach(w => {
                if (w.length < 3 || stopWords.has(w)) return;
                wordCounts[w] = (wordCounts[w] || 0) + 1;
                if (!wordChannelMap[w]) wordChannelMap[w] = {};
                wordChannelMap[w][chName] = (wordChannelMap[w][chName] || 0) + 1;
            });
        });
        const topKeywords = Object.entries(wordCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 15)
            .map(([keyword, count]) => {
                const chEntries = Object.entries(wordChannelMap[keyword] || {}).sort(([, a], [, b]) => b - a);
                return { keyword, count, channel: chEntries[0]?.[0] || '-' };
            });

        // ── TEAM WORKLOAD DATA ──

        const memberMap = new Map();
        workspace.members.forEach(m => {
            const u = m.user;
            if (!u) return;
            const uid = u._id?.toString() || u.toString();
            memberMap.set(uid, {
                _id: uid,
                fullname: u.fullname || 'Unknown',
                avatar: u.avatar || '',
                role: m.role
            });
        });

        const workloadByMember = {};
        allCards.forEach(c => {
            (c.assignees || []).forEach(a => {
                const uid = a._id?.toString() || a.toString();
                if (!workloadByMember[uid]) workloadByMember[uid] = { todo: 0, inProgress: 0, done: 0, overdue: 0 };
                const lid = c.listId.toString();
                if (listIsDone.get(lid)) workloadByMember[uid].done++;
                else if (listIsInProgress.get(lid)) workloadByMember[uid].inProgress++;
                else workloadByMember[uid].todo++;
                if (c.dueDate && new Date(c.dueDate) < now && !listIsDone.get(lid)) {
                    workloadByMember[uid].overdue++;
                }
            });
        });

        const memberWorkload = [];
        const memberCompleted = [];
        memberMap.forEach((info, uid) => {
            const w = workloadByMember[uid] || { todo: 0, inProgress: 0, done: 0, overdue: 0 };
            const activeCount = w.todo + w.inProgress;
            memberWorkload.push({
                ...info,
                todo: w.todo,
                inProgress: w.inProgress,
                overdue: w.overdue,
                active: activeCount,
                overloaded: activeCount > 10
            });
            memberCompleted.push({ ...info, completed: w.done });
        });
        memberWorkload.sort((a, b) => b.active - a.active);
        memberCompleted.sort((a, b) => b.completed - a.completed);

        // Workload insights
        const mostLoaded = memberWorkload[0] || null;
        const mostOverdue = [...memberWorkload].sort((a, b) => b.overdue - a.overdue)[0] || null;
        const bestThroughput = memberCompleted[0] || null;

        res.json({
            kpi: {
                completionRate,
                completedCards,
                totalCards,
                throughputWeekly,
                overdueTasks: overdueCards.length,
                activeProjects: activeProjects.length,
                totalMessages
            },
            projectHealth: {
                velocity,
                cumulativeFlow,
                projectProgress,
                stuckTasks
            },
            communication: {
                messagesVsTasks,
                channelActivity,
                dmVsChannel: { dm: dmCount, channel: channelCount },
                topKeywords
            },
            teamWorkload: {
                memberWorkload,
                memberCompleted,
                insights: {
                    mostLoaded: mostLoaded ? { name: mostLoaded.fullname, count: mostLoaded.active } : null,
                    mostOverdue: mostOverdue ? { name: mostOverdue.fullname, count: mostOverdue.overdue } : null,
                    bestThroughput: bestThroughput ? { name: bestThroughput.fullname, count: bestThroughput.completed } : null
                }
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error" });
    }
};
