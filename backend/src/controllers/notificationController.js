import Notification from '../models/Notification.js';
import { asyncHandler } from '../middleware/errorHandler.js';


export const getNotifications = asyncHandler(async (req, res) => {
    const notifications = await Notification.find({ recipient: req.user._id })
        .sort({ createdAt: -1 })
        .populate('sender', 'fullname avatar');
    
    res.json(notifications);
});

export const getMentions = asyncHandler(async (req, res) => {
    const mentions = await Notification.find({
        recipient: req.user._id,
        type: 'mention'
    })
        .sort({ createdAt: -1 })
        .populate('sender', 'fullname avatar');
    
    res.json(mentions);
});

export const markAsRead = asyncHandler(async (req, res) => {
    await Notification.findByIdAndUpdate(req.params.id, { isRead: true });
    res.json({ message: "Marked as read" });
});


export const markAllRead = asyncHandler(async (req, res) => {
    await Notification.updateMany({ recipient: req.user._id }, { isRead: true });
    res.json({ message: "All marked read" });
});