import Notification from '../models/Notification.js';


export const getNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({ recipient: req.user._id })
            .sort({ createdAt: -1 })
            .populate('sender', 'fullname avatar');
        
        res.json(notifications);
    } catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
};

export const getMentions = async (req, res) => {
    try {
        const mentions = await Notification.find({
            recipient: req.user._id,
            type: 'mention'
        })
            .sort({ createdAt: -1 })
            .populate('sender', 'fullname avatar');
        
        res.json(mentions);
    } catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
};

export const markAsRead = async (req, res) => {
    try {
        await Notification.findByIdAndUpdate(req.params.id, { isRead: true });
        res.json({ message: "Marked as read" });
    } catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
};


export const markAllRead = async (req, res) => {
    try {
        await Notification.updateMany({ recipient: req.user._id }, { isRead: true });
        res.json({ message: "All marked read" });
    } catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
};