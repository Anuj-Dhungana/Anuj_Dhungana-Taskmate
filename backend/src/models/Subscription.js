import mongoose from 'mongoose';
import { WORKSPACE_PLAN, normalizeWorkspacePlan } from '../config/workspacePlans.js';
import { SUBSCRIPTION_STATUSES } from '../config/billing.js';

const subscriptionSchema = new mongoose.Schema(
    {
        workspace: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Workspace',
            required: true,
            index: true,
        },
        plan: {
            type: String,
            enum: [WORKSPACE_PLAN.FREE, WORKSPACE_PLAN.PRO],
            required: true,
            default: WORKSPACE_PLAN.FREE,
            set: normalizeWorkspacePlan,
        },
        status: {
            type: String,
            enum: SUBSCRIPTION_STATUSES,
            default: 'pending',
            required: true,
            index: true,
        },
        startDate: {
            type: Date,
            default: Date.now,
            required: true,
        },
        endDate: {
            type: Date,
        },
    },
    {
        timestamps: true,
    }
);

subscriptionSchema.index({ workspace: 1, createdAt: -1 });

const Subscription = mongoose.model('Subscription', subscriptionSchema);

export default Subscription;
