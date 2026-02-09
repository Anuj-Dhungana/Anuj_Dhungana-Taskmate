import mongoose from 'mongoose';

const subtaskSchema = new mongoose.Schema(
    {
        text: { type: String, required: true, trim: true },
        done: { type: Boolean, default: false },
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    },
    { timestamps: true }
);

const commentSchema = new mongoose.Schema(
    {
        author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        content: { type: String, required: true, trim: true },
    },
    { timestamps: true }
);

const activitySchema = new mongoose.Schema(
    {
        type: { type: String, required: true, trim: true },
        message: { type: String, required: true, trim: true },
        actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    },
    { timestamps: true }
);

const cardSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, default: '' },
    listId: { type: mongoose.Schema.Types.ObjectId, ref: 'List', required: true },
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    order: { type: Number, default: 0 }, // To keep them sorted top-to-bottom
    assignees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    attachments: [String], 
    dueDate: { type: Date },
    priority: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' },
    archived: { type: Boolean, default: false },
    subtasks: [subtaskSchema],
    comments: [commentSchema],
    activity: [activitySchema],
}, {
    timestamps: true
});

const Card = mongoose.model('Card', cardSchema);
export default Card;
