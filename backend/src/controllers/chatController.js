import Message from '../models/Message.js';

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