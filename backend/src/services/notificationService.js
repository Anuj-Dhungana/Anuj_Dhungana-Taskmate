import Notification from '../models/Notification.js';

export const getUserNotifications = async (userId) =>
    Notification.find({ recipient: userId })
        .sort({ createdAt: -1 })
        .populate('sender', 'fullname avatar');

export const getUserMentions = async (userId) =>
    Notification.find({ recipient: userId, type: 'mention' })
        .sort({ createdAt: -1 })
        .populate('sender', 'fullname avatar');

export const markNotificationAsRead = async (notificationId) =>
    Notification.findByIdAndUpdate(notificationId, { isRead: true });

export const markAllNotificationsRead = async (userId) =>
    Notification.updateMany({ recipient: userId }, { isRead: true });
