import mongoose from 'mongoose';

const cardSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, default: '' },
    listId: { type: mongoose.Schema.Types.ObjectId, ref: 'List', required: true },
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    order: { type: Number, default: 0 }, // To keep them sorted top-to-bottom
    assignees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    attachments: [String], 
    dueDate: { type: Date },
    priority: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' }
}, {
    timestamps: true
});

const Card = mongoose.model('Card', cardSchema);
export default Card;