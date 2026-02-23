import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    message: { type: String, required: true },
    type: { type: String, enum: ['assignment', 'alert', 'info', 'workspace_invite', 'invite_accepted', 'mention'], default: 'info' },
    relatedId: { type: String },
    taskTitle: { type: String },
    commentContent: { type: String },
    isRead: { type: Boolean, default: false }
}, {
    timestamps: true
});

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;