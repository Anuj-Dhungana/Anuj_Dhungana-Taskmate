import mongoose from 'mongoose';

const workspaceSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        default: ''
    },
    color: {
        type: String,
        default: '#F97316'
    },
    // Who owns/is inside this workspace?
    members: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        role: { 
            type: String, 
            enum: ['owner', 'admin', 'member'], 
            default: 'member' 
        },
        joinedAt: { type: Date, default: Date.now }
    }],
    settings: {
        access: {
            defaultInviteRole: {
                type: String,
                enum: ['member', 'admin'],
                default: 'member',
            },
            requireInviteAcceptance: {
                type: Boolean,
                default: true,
            },
            membersCanViewMemberList: {
                type: Boolean,
                default: true,
            },
        },
        billing: {
            currentPlan: {
                type: String,
                enum: ['free', 'premium'],
                default: 'free',
            },
        },
    },
    
}, {
    timestamps: true
});

const Workspace = mongoose.model('Workspace', workspaceSchema);
export default Workspace;
