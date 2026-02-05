import List from '../models/List.js';
import Card from '../models/Card.js';
import Project from '../models/Project.js';
import Notification from '../models/Notification.js';
import Workspace from '../models/Workspace.js';
import Message from '../models/Message.js';


export const getBoard = async (req, res) => {
    try {
        const { projectId } = req.params;

        // 1. Fetch Lists (Sorted by order)
        const lists = await List.find({ projectId }).sort('order');
        
        // 2. Fetch Cards (Sorted by order)
        const cards = await Card.find({ projectId }).sort('order').populate('assignees', 'fullname avatar');

        res.json({ lists, cards });
    } catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
};


export const createList = async (req, res) => {
    try {
        const { title, projectId } = req.body;
        
        // Find highest order to put this at the end
        const lastList = await List.findOne({ projectId }).sort('-order');
        const newOrder = lastList ? lastList.order + 1 : 0;

        const list = await List.create({
            title,
            projectId,
            order: newOrder
        });

        res.status(201).json(list);
    } catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
};


export const createCard = async (req, res) => {
    try {
        const { title, listId, projectId, description, dueDate, assignees = [], priority } = req.body;

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
            assignees: Array.isArray(assignees) ? assignees : [],
            priority: ['Low', 'Medium', 'High'].includes(priority) ? priority : 'Medium'
        });

        await card.populate('assignees', 'fullname avatar');
        res.status(201).json(card);
    } catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
};


export const updateCardOrder = async (req, res) => {
    try {
        const { cardId, newListId, newOrder } = req.body;

        // Update the card
        await Card.findByIdAndUpdate(cardId, {
            listId: newListId,
            order: newOrder
        });

        res.json({ message: "Order updated" });
    } catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
};



export const deleteCard = async (req, res) => {
    try {
        const { id } = req.params;
        await Card.findByIdAndDelete(id);
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

        // Update Text Fields
        if (title) card.title = title;
        if (description !== undefined) card.description = description;
        if (dueDate !== undefined) card.dueDate = dueDate;
        if (priority !== undefined && ['Low', 'Medium', 'High'].includes(priority)) card.priority = priority;
        
        // Update Assignees
        if (assignees) {
            const newAssignees = Array.isArray(assignees) ? assignees : JSON.parse(assignees);
            
            // Find who is NEWLY assigned
            const previousAssignees = card.assignees.map(id => id.toString());
            const addedUsers = newAssignees.filter(id => !previousAssignees.includes(id));

            card.assignees = newAssignees;

            // Send Notifications to new assignees
            const io = req.app.get('io'); // Get Socket Instance

            const project = await Project.findById(card.projectId).select('workspace');
            const workspaceRoom = project?.workspace ? `workspace_${project.workspace}` : null;

            addedUsers.forEach(async (userId) => {
                // Don't notify if assigning self
                if (userId !== req.user._id.toString()) {
                    
                    // 1. Create DB Record
                    const notif = await Notification.create({
                        recipient: userId,
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
                        recipient: userId, // Frontend will filter this
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
        }

        await card.save();
        
        // Populate assignees to show their names immediately on frontend
        await card.populate('assignees', 'fullname avatar');

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

        const cards = await Card.find({ projectId: { $in: projectIds } })
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
            assignees: req.user._id
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

        const cards = await Card.find({ projectId: { $in: projectIds } }).select('listId');
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

        const projects = await Project.find({ workspace: workspaceId })
            .select('name status dueDate createdAt members')
            .sort({ createdAt: -1 });
        const projectIds = projects.map(p => p._id);

        const lists = await List.find({ projectId: { $in: projectIds } }).select('_id title projectId');
        const listIsDone = new Map(
            lists.map(l => [l._id.toString(), (l.title || '').toLowerCase() === 'done'])
        );

        const cards = await Card.find({ projectId: { $in: projectIds } })
            .select('_id title projectId createdAt listId');

        const counts = {};
        cards.forEach((card) => {
            const pid = card.projectId.toString();
            if (!counts[pid]) counts[pid] = { total: 0, done: 0 };
            counts[pid].total += 1;
            if (listIsDone.get(card.listId.toString())) {
                counts[pid].done += 1;
            }
        });

        const projectProgress = projects.map((p) => {
            const c = counts[p._id.toString()] || { total: 0, done: 0 };
            const progress = c.total === 0 ? 0 : Math.round((c.done / c.total) * 100);
            return {
                _id: p._id,
                name: p.name,
                status: p.status,
                dueDate: p.dueDate,
                createdAt: p.createdAt,
                totalCards: c.total,
                doneCards: c.done,
                progress,
                membersCount: p.members?.length || 0
            };
        });

        const recentCards = await Card.find({ projectId: { $in: projectIds } })
            .select('title projectId createdAt')
            .sort({ createdAt: -1 })
            .limit(20);

        const recentMessages = await Message.find({ workspaceId })
            .populate('sender', 'fullname avatar')
            .populate('channelId', 'name')
            .sort({ createdAt: -1 })
            .limit(20);

        const recentProjects = await Project.find({ workspace: workspaceId })
            .select('name createdAt createdBy')
            .populate('createdBy', 'fullname avatar')
            .sort({ createdAt: -1 })
            .limit(20);

        const projectNameMap = new Map(projects.map(p => [p._id.toString(), p.name]));

        const activity = [
            ...recentCards.map(c => ({
                type: 'card',
                action: 'created',
                title: c.title,
                projectId: c.projectId,
                projectName: projectNameMap.get(c.projectId.toString()) || 'Project',
                createdAt: c.createdAt
            })),
            ...recentMessages.map(m => ({
                type: 'message',
                action: 'sent',
                title: m.content,
                channelName: m.channelId?.name || 'channel',
                user: m.sender ? { _id: m.sender._id, fullname: m.sender.fullname, avatar: m.sender.avatar } : null,
                createdAt: m.createdAt
            })),
            ...recentProjects.map(p => ({
                type: 'project',
                action: 'created',
                title: p.name,
                user: p.createdBy ? { _id: p.createdBy._id, fullname: p.createdBy.fullname, avatar: p.createdBy.avatar } : null,
                createdAt: p.createdAt
            }))
        ];

        activity.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        const totalCards = cards.length;
        const completedTasks = cards.filter(c => listIsDone.get(c.listId.toString())).length;
        const activeTasks = totalCards - completedTasks;

        res.json({
            projects: projectProgress,
            activity: activity.slice(0, 15),
            stats: {
                totalProjects: projectProgress.length,
                totalCards,
                completedTasks,
                activeTasks
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error" });
    }
};
