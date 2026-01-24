import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    status: { type: String, default: 'Planning', trim: true },
    startDate: { type: Date },
    dueDate: { type: Date },
    tags: [{ type: String, trim: true }],
    
    // Link to Parent Workspace
    workspace: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Workspace', 
        required: true 
    },
    
    // Who created it?
    createdBy: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User' 
    },

    members: [
        {
            user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
            role: { type: String, enum: ['Manager', 'Contributor', 'Viewer'], default: 'Contributor' }
        }
    ],

   
}, {
    timestamps: true
});

const Project = mongoose.model('Project', projectSchema);
export default Project;