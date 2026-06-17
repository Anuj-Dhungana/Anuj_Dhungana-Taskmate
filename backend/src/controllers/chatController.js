import Message from '../models/Message.js';
import Workspace from '../models/Workspace.js';
import Channel from '../models/Channel.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const ensureChannelAccess = async (channelId, userId) => {
    const channel = await Channel.findById(channelId);
    if (!channel) {
        return { channel: null, workspace: null, status: 404, message: "Channel not found" };
    }

    if (channel.type === 'dm') {
        const isMember = (channel.members || []).some(
            (m) => m.toString() === userId.toString()
        );
        if (!isMember) {
            return { channel, workspace: null, status: 403, message: "Not authorized" };
        }
        return { channel, workspace: null, status: 200 };
    }

    const workspace = await Workspace.findById(channel.workspace);
    if (!workspace) {
        return { channel, workspace: null, status: 404, message: "Workspace not found" };
    }

    const isMember = workspace.members.some(
        (m) => m.user.toString() === userId.toString()
    );
    if (!isMember) {
        return { channel, workspace, status: 403, message: "Not authorized" };
    }

    return { channel, workspace, status: 200 };
};

export const getMessages = asyncHandler(async (req, res) => {
    const { channelId } = req.params;

    const access = await ensureChannelAccess(channelId, req.user._id);
    if (access.status !== 200) {
        return res.status(access.status).json({ message: access.message });
    }

    const messages = await Message.find({ channelId })
        .populate('sender', 'fullname avatar email')
        .populate('poll.options.votes', 'fullname avatar')
        .populate({ path: 'replyTo', populate: { path: 'sender', select: 'fullname avatar' } })
        .sort({ createdAt: 1 }); // Oldest first

    res.json(messages);
});


export const sendMessage = asyncHandler(async (req, res) => {
    const { workspaceId, channelId, content } = req.body;
    const access = await ensureChannelAccess(channelId, req.user._id);
    if (access.status !== 200) {
        return res.status(access.status).json({ message: access.message });
    }

    const safeWorkspaceId = access.channel.workspace?.toString() || workspaceId;

    const newMessage = await Message.create({
        workspaceId: safeWorkspaceId,
        channelId,
        sender: req.user._id,
        content
    });

    const fullMessage = await newMessage.populate('sender', 'fullname avatar');
    await fullMessage.populate('poll.options.votes', 'fullname avatar');
    
    res.status(201).json(fullMessage);
});

export const deleteMessage = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const message = await Message.findById(id);
    if (!message) {
        return res.status(404).json({ message: "Message not found" });
    }

    const channel = await Channel.findById(message.channelId).select('type');
    if (!channel) {
        return res.status(404).json({ message: "Channel not found" });
    }

    const workspace = await Workspace.findById(message.workspaceId);
    if (!workspace) {
        return res.status(404).json({ message: "Workspace not found" });
    }

    const member = workspace.members.find(
        (m) => m.user.toString() === req.user._id.toString()
    );
    if (!member) {
        return res.status(403).json({ message: "Not authorized" });
    }

    const isModerator = member.role === 'owner' || member.role === 'admin';
    const isSender = message.sender.toString() === req.user._id.toString();
    if (channel.type === 'dm') {
        if (!isSender) {
            return res.status(403).json({ message: "Not authorized to delete this message" });
        }
    } else if (!isModerator && !isSender) {
        return res.status(403).json({ message: "Not authorized to delete this message" });
    }

    await message.deleteOne();
    res.json({ message: "Message deleted" });
});

export const votePoll = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { optionIndex } = req.body;
    const userId = req.user._id;

    const message = await Message.findById(id);
    if (!message || !message.poll || !message.poll.options) {
        return res.status(404).json({ message: "Poll not found" });
    }

    const access = await ensureChannelAccess(message.channelId, userId);
    if (access.status !== 200) {
        return res.status(access.status).json({ message: access.message });
    }

    if (optionIndex < 0 || optionIndex >= message.poll.options.length) {
        return res.status(400).json({ message: "Invalid option" });
    }

    const hasVotedThisOption = message.poll.options[optionIndex].votes.includes(userId);

    if (!message.poll.multipleAnswers) {
        // Remove user from all other options
        message.poll.options.forEach((opt) => {
            const index = opt.votes.indexOf(userId);
            if (index > -1) opt.votes.splice(index, 1);
        });
    }

    if (hasVotedThisOption) {
        const idx = message.poll.options[optionIndex].votes.indexOf(userId);
        if (idx > -1) {
            message.poll.options[optionIndex].votes.splice(idx, 1);
        }
    } else {
        message.poll.options[optionIndex].votes.push(userId);
    }

    await message.save();

    const fullMessage = await Message.findById(id).populate('sender', 'fullname avatar').populate('poll.options.votes', 'fullname avatar');

    const io = req.app.get('io');
    if (io) {
        io.to(message.channelId.toString()).emit("poll_updated", fullMessage);
    }

    res.json(fullMessage);
});

export const toggleReaction = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { emoji } = req.body;
    const userId = req.user._id;

    if (!emoji) return res.status(400).json({ message: "Emoji is required" });

    const message = await Message.findById(id);
    if (!message) return res.status(404).json({ message: "Message not found" });

    const access = await ensureChannelAccess(message.channelId, userId);
    if (access.status !== 200) {
        return res.status(access.status).json({ message: access.message });
    }

    if (!message.reactions) message.reactions = [];

    let wasAlreadyReactedWithRequestedEmoji = false;

    // 1. Remove the user from ALL existing emojis
    message.reactions.forEach(reactionObj => {
        const userIndex = reactionObj.users.findIndex(
            (u) => u.toString() === userId.toString()
        );
        if (userIndex > -1) {
            reactionObj.users.splice(userIndex, 1);
            if (reactionObj.emoji === emoji) {
                wasAlreadyReactedWithRequestedEmoji = true; // It's a toggle off
            }
        }
    });

    // Clean up any emojis that now have 0 users
    message.reactions = message.reactions.filter(r => r.users.length > 0);

    // 2. If they hadn't already reacted with THIS emoji, add it
    if (!wasAlreadyReactedWithRequestedEmoji) {
        let reactionObj = message.reactions.find(r => r.emoji === emoji);
        if (reactionObj) {
            reactionObj.users.push(userId);
        } else {
            message.reactions.push({ emoji, users: [userId] });
        }
    }

    await message.save();

    const fullMessage = await Message.findById(id)
        .populate('sender', 'fullname avatar')
        .populate('poll.options.votes', 'fullname avatar')
        .populate({ path: 'replyTo', populate: { path: 'sender', select: 'fullname avatar' } });

    const io = req.app.get('io');
    if (io) {
        io.to(message.channelId.toString()).emit("message_updated", fullMessage);
    }

    res.json(fullMessage);
});
