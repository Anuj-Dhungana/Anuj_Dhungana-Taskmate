import mongoose from 'mongoose';

const channelSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    
    // Link to Parent Workspace
    workspace: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Workspace', 
        required: true 
    },

    type: {
        type: String,
        enum: ['channel', 'dm'],
        default: 'channel'
    },

    members: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    
    // Default channels like #general cannot be deleted
    isGeneral: { type: Boolean, default: false }
}, {
    timestamps: true
});

const Channel = mongoose.model('Channel', channelSchema);
export default Channel;
