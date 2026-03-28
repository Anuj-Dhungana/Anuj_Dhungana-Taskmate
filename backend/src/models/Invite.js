import mongoose from 'mongoose';
import crypto from 'crypto';

const inviteSchema = new mongoose.Schema({
    workspace: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Workspace',
        required: true,
    },
    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
    },
    invitedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    role: {
        type: String,
        enum: ['member', 'admin'],
        default: 'member',
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'declined', 'expired'],
        default: 'pending',
    },
    token: {
        type: String,
        unique: true,
        sparse: true, // Only for external invites
    },
    invitedUser: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        // Only set if email belongs to existing user
    },
    expiresAt: {
        type: Date,
        required: true,
        default: () => new Date(Date.now() + 72 * 60 * 60 * 1000), // 72 hours
    },
}, { timestamps: true });

// Index for efficient queries
inviteSchema.index({ workspace: 1, email: 1, status: 1 });
inviteSchema.index({ invitedUser: 1, status: 1 });
inviteSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // Auto-delete expired

// Generate unique token for external invites
inviteSchema.methods.generateToken = function() {
    this.token = crypto.randomBytes(32).toString('hex');
    return this.token;
};

// Check if invite is expired
inviteSchema.methods.isExpired = function() {
    return new Date() > this.expiresAt;
};

const Invite = mongoose.model('Invite', inviteSchema);

export default Invite;
