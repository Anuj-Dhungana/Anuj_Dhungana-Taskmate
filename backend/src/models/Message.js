import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
    workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true },
    channelId: { type: mongoose.Schema.Types.ObjectId, ref: 'Channel', required: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, default: '' },
    attachments: [{
        url: String,
        public_id: String,
        resource_type: String,
        original_filename: String,
    }],
    poll: {
        question: String,
        options: [{
            text: String,
            votes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
        }],
        multipleAnswers: { type: Boolean, default: false }
    }
}, {
    timestamps: true
});

const Message = mongoose.model('Message', messageSchema);
export default Message;