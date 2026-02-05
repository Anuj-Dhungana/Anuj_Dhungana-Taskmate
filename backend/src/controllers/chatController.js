import Message from '../models/Message.js';
import Workspace from '../models/Workspace.js';

export const getMessages = async (req, res) => {
    try {
        const { channelId } = req.params;

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
        
        const newMessage = await Message.create({
            workspaceId,
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
        if (!isModerator && !isSender) {
            return res.status(403).json({ message: "Not authorized to delete this message" });
        }

        await message.deleteOne();
        res.json({ message: "Message deleted" });
    } catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
};
