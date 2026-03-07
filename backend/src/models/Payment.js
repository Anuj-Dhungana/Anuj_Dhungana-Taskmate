import mongoose from 'mongoose';
import { WORKSPACE_PLAN, normalizeWorkspacePlan } from '../config/workspacePlans.js';
import { PAYMENT_METHODS, PAYMENT_STATUSES } from '../config/billing.js';

const paymentSchema = new mongoose.Schema(
    {
        workspace: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Workspace',
            required: true,
            index: true,
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        plan: {
            type: String,
            enum: [WORKSPACE_PLAN.FREE, WORKSPACE_PLAN.PRO],
            required: true,
            default: WORKSPACE_PLAN.PRO,
            set: normalizeWorkspacePlan,
        },
        amount: {
            type: Number,
            required: true,
            min: 0,
        },
        paymentMethod: {
            type: String,
            enum: PAYMENT_METHODS,
            default: 'khalti',
            required: true,
        },
        khaltiTransactionId: {
            type: String,
            trim: true,
            index: true,
            sparse: true,
        },
        purchaseOrderId: {
            type: String,
            required: true,
            trim: true,
            unique: true,
            index: true,
        },
        status: {
            type: String,
            enum: PAYMENT_STATUSES,
            default: 'pending',
            required: true,
            index: true,
        },
        paidAt: {
            type: Date,
        },
        providerResponse: {
            type: mongoose.Schema.Types.Mixed,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

paymentSchema.index({ workspace: 1, createdAt: -1 });
paymentSchema.index({ user: 1, createdAt: -1 });
paymentSchema.index({ workspace: 1, status: 1 });

const Payment = mongoose.model('Payment', paymentSchema);

export default Payment;
