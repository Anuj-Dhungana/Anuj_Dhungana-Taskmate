import mongoose from 'mongoose';

const listSchema = new mongoose.Schema({
    title: { type: String, required: true },
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    order: { type: Number, default: 0 } // To keep them sorted left-to-right
});

const List = mongoose.model('List', listSchema);
export default List;