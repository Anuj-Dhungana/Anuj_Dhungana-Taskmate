import Message from '../models/Message.js';
import Workspace from '../models/Workspace.js';
import Channel from '../models/Channel.js';

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

export const getMessages = async (req, res) => {
    try {
        const { channelId } = req.params;

        const access = await ensureChannelAccess(channelId, req.user._id);
        if (access.status !== 200) {
            return res.status(access.status).json({ message: access.message });
        }

        const messages = await Message.find({ channelId })
            .populate('sender', 'fullname avatar email')
            .sort({ createdAt: 1 }); // Oldest first

        res.json(messages);
    } catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
};


export const sendMessage = async (req, res) => {
    try {
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
        
        res.status(201).json(fullMessage);
    } catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
};

export const deleteMessage = async (req, res) => {
    try {
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
    } catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
};
