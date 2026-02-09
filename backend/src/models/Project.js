import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    status: { type: String, default: 'Planning', trim: true },
    priority: {
        type: String,
        enum: ['Low', 'Medium', 'High'],
        default: 'Medium',
        trim: true
    },
    startDate: { type: Date },
    dueDate: { type: Date },
    projectColor: {
        type: String,
        trim: true,
        default: '#6366F1',
        match: /^#(?:[0-9a-fA-F]{3}){1,2}$/
    },
    calendarEnabled: { type: Boolean, default: true },
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
