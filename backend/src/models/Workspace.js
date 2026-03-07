import mongoose from 'mongoose';
import { WORKSPACE_PLAN, normalizeWorkspacePlan } from '../config/workspacePlans.js';

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
                enum: [WORKSPACE_PLAN.FREE, WORKSPACE_PLAN.PRO],
                default: WORKSPACE_PLAN.FREE,
                set: normalizeWorkspacePlan,
            },
        },
    },
    
}, {
    timestamps: true
});

workspaceSchema.pre('validate', function normalizeLegacyBillingPlan() {
    if (!this.settings) {
        this.settings = {};
    }

    if (!this.settings.billing) {
        this.settings.billing = {};
    }

    this.settings.billing.currentPlan = normalizeWorkspacePlan(this.settings.billing.currentPlan);
});

const Workspace = mongoose.model('Workspace', workspaceSchema);
export default Workspace;
