import Invite from '../models/Invite.js';
import Workspace from '../models/Workspace.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import sendEmail from '../utils/sendEmail.js';
import { canAddMembersToWorkspace } from './workspacePlanService.js';


// URL helpers


const getFrontendBaseUrl = () =>
    String(process.env.FRONTEND_URL || 'http://localhost:5173')
        .trim()
        .replace(/\/+$/, '');

export const buildInviteLink = (token) =>
    `${getFrontendBaseUrl()}/invite/${token}`;

export const buildDashboardLink = () =>
    `${getFrontendBaseUrl()}/dashboard`;

// ---------------------------------------------------------------------------
// Email senders


export const sendExternalInviteEmail = ({ recipientEmail, inviterName, workspaceName, inviteLink }) =>
    sendEmail({
        email: recipientEmail,
        subject: `You've been invited to ${workspaceName}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #6366F1;">Workspace Invitation</h2>
                <p>${inviterName} has invited you to join <strong>${workspaceName}</strong> on TaskMate.</p>
                <p>Click the button below to accept:</p>
                <a href="${inviteLink}" style="display: inline-block; padding: 12px 24px; background: #6366F1; color: white; text-decoration: none; border-radius: 8px; margin: 20px 0;">Accept Invite</a>
                <p style="color: #666; font-size: 14px;">This invite will expire in 72 hours.</p>
                <p style="color: #666; font-size: 14px;">If you don't have an account, you'll be asked to register first.</p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                <p style="color: #999; font-size: 12px;">Or copy and paste this link: ${inviteLink}</p>
            </div>
        `,
    });

export const sendExistingUserInviteEmail = ({ recipientEmail, recipientName, inviterName, workspaceName, inviteRole, inviteLink }) =>
    sendEmail({
        email: recipientEmail,
        subject: `You've been invited to ${workspaceName}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #6366F1;">Workspace Invitation</h2>
                <p>Hi ${recipientName},</p>
                <p>${inviterName} has invited you to join <strong>${workspaceName}</strong> on TaskMate as a <strong>${inviteRole}</strong>.</p>
                <p>Click the button below to view and accept your invitation:</p>
                <a href="${inviteLink}" style="display: inline-block; padding: 12px 24px; background: #6366F1; color: white; text-decoration: none; border-radius: 8px; margin: 20px 0;">View Invitation</a>
                <p style="color: #666; font-size: 14px;">This invite will expire in 72 hours.</p>
                <p style="color: #666; font-size: 14px;">You can also find this invitation in your TaskMate inbox.</p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                <p style="color: #999; font-size: 12px;">Or copy and paste this link: ${inviteLink}</p>
            </div>
        `,
    });


// Validation helpers


/**
 * Resolve and validate the invite role from the request and workspace settings.
 */
export const resolveInviteRole = (role, workspace) => {
    const inviteRole = role || workspace.settings?.access?.defaultInviteRole || 'member';
    if (!['member', 'admin'].includes(inviteRole)) {
        const err = new Error("Invalid role. Must be 'member' or 'admin'");
        err.status = 400;
        throw err;
    }
    return inviteRole;
};

/**
 * Assert that the requester has permission to invite, and that they can
 * assign the requested role.
 */
export const assertInviterPermissions = (requester, inviteRole) => {
    if (!requester || !['owner', 'admin'].includes(requester.role)) {
        const err = new Error('Only owners and admins can invite members');
        err.status = 403;
        throw err;
    }
    if (requester.role === 'admin' && inviteRole === 'admin') {
        const err = new Error('Only owners can invite members with admin role');
        err.status = 403;
        throw err;
    }
};

/**
 * Assert workspace member limit allows adding more members.
 */
export const assertMemberLimit = (workspace) => {
    const memberAllowance = canAddMembersToWorkspace(workspace, 1);
    if (!memberAllowance.allowed) {
        const err = new Error(
            `Free plan allows up to ${memberAllowance.limit} members in this workspace. Upgrade to Pro for unlimited members.`
        );
        err.status = 403;
        err.code = 'MEMBER_LIMIT_REACHED';
        err.limit = memberAllowance.limit;
        err.currentCount = memberAllowance.currentMembers;
        throw err;
    }
};


// Invite lifecycle helpers


/**
 * If the invite is expired, mark it expired and save. Returns updated invite (or null).
 */
export const checkAndExpireInvite = async (invite) => {
    if (invite && invite.isExpired()) {
        invite.status = 'expired';
        await invite.save();
        return null;
    }
    return invite;
};

/**
 * Handle the case where a pending invite already exists for the email.
 * Resends the appropriate email and returns the response payload.
 */
export const handleExistingPendingInvite = async (existingInvite, existingUser, requester, workspace, inviteRole) => {
    if (existingUser) {
        const inviteLink = buildDashboardLink();
        await sendExistingUserInviteEmail({
            recipientEmail: existingUser.email,
            recipientName: existingUser.fullname || 'there',
            inviterName: requester.fullname,
            workspaceName: workspace.name,
            inviteRole,
            inviteLink,
        });
    } else {
        if (!existingInvite.token) {
            existingInvite.generateToken();
            await existingInvite.save();
        }
        const inviteLink = buildInviteLink(existingInvite.token);
        await sendExternalInviteEmail({
            recipientEmail: existingInvite.email,
            inviterName: requester.fullname,
            workspaceName: workspace.name,
            inviteLink,
        });
    }
    await existingInvite.populate('invitedBy', 'fullname email avatar');
    return {
        httpStatus: 200,
        message: 'An invite is already pending for this email. Invite email has been resent.',
        invite: existingInvite,
        resent: true,
        emailDelivered: true,
    };
};

/**
 * Create an invite for an external (non-registered) user:
 * generates a token and sends an external invite email.
 * Deletes the invite if email fails.
 */
export const createExternalInvite = async ({ workspaceId, normalizedEmail, invitedBy, inviteRole, workspace }) => {
    const invite = await Invite.create({
        workspace: workspaceId,
        email: normalizedEmail,
        invitedBy,
        role: inviteRole,
        invitedUser: null,
    });

    invite.generateToken();
    await invite.save();

    const inviteLink = buildInviteLink(invite.token);
    try {
        await sendExternalInviteEmail({
            recipientEmail: normalizedEmail,
            inviterName: invite._inviterName, // set below
            workspaceName: workspace.name,
            inviteLink,
        });
    } catch (emailError) {
        console.error('Email send failed:', emailError);
        await invite.deleteOne();
        const err = new Error(
            'Invite email could not be sent. Please verify the recipient address and try again.'
        );
        err.status = 502;
        throw err;
    }

    return invite;
};

/**
 * Create an invite for an existing (registered) user:
 * creates a DB notification, emits a socket event, and sends an email.
 */
export const createInternalInvite = async ({ workspaceId, normalizedEmail, invitedBy, inviteRole, workspace, existingUser, io, requesterFullname }) => {
    const invite = await Invite.create({
        workspace: workspaceId,
        email: normalizedEmail,
        invitedBy,
        role: inviteRole,
        invitedUser: existingUser._id,
    });

    // In-app notification
    await Notification.create({
        recipient: existingUser._id,
        sender: invitedBy,
        message: `invited you to join workspace "${workspace.name}"`,
        type: 'workspace_invite',
        relatedId: invite._id,
    });

    // Real-time
    io.to(`user_${existingUser._id.toString()}`).emit('new_notification', {
        recipient: existingUser._id.toString(),
        sender: { fullname: requesterFullname },
        message: `invited you to join workspace "${workspace.name}"`,
        type: 'workspace_invite',
        relatedId: invite._id,
    });

    // Email
    const inviteLink = buildDashboardLink();
    try {
        await sendExistingUserInviteEmail({
            recipientEmail: existingUser.email,
            recipientName: existingUser.fullname || 'there',
            inviterName: requesterFullname,
            workspaceName: workspace.name,
            inviteRole,
            inviteLink,
        });
    } catch (emailError) {
        console.error('Email send to existing user failed:', emailError);
        await invite.populate('invitedBy', 'fullname email avatar');
        return { invite, emailDelivered: false };
    }

    return { invite, emailDelivered: true };
};


// Public service functions (called by the controller)

/**
 * Send an invite to a workspace.
 */
export const sendInvite = async ({ workspaceId, email, role, requester, io }) => {
    const normalizedEmail = String(email || '').toLowerCase().trim();
    if (!workspaceId || !normalizedEmail) {
        const err = new Error('workspaceId and email are required');
        err.status = 400;
        throw err;
    }

    const workspace = await Workspace.findById(workspaceId).populate('members.user', 'fullname email');
    if (!workspace) {
        const err = new Error('Workspace not found');
        err.status = 404;
        throw err;
    }

    const inviteRole = resolveInviteRole(role, workspace);

    const workspaceMember = workspace.members.find(
        (m) => m.user && m.user._id.toString() === requester._id.toString()
    );
    assertInviterPermissions(workspaceMember, inviteRole);

    assertMemberLimit(workspace);

    // Already a member?
    const existingMember = workspace.members.find(
        (m) => m.user && m.user.email === normalizedEmail
    );
    if (existingMember) {
        const err = new Error('User is already a member of this workspace');
        err.status = 400;
        throw err;
    }

    const existingUser = await User.findOne({ email: normalizedEmail });

    // Check for existing pending invite
    let existingInvite = await Invite.findOne({
        workspace: workspaceId,
        email: normalizedEmail,
        status: 'pending',
    });
    existingInvite = await checkAndExpireInvite(existingInvite);

    if (existingInvite) {
        return handleExistingPendingInvite(existingInvite, existingUser, requester, workspace, inviteRole);
    }

    // Create new invite
    if (!existingUser) {
        const invite = await Invite.create({
            workspace: workspaceId,
            email: normalizedEmail,
            invitedBy: requester._id,
            role: inviteRole,
            invitedUser: null,
        });
        invite.generateToken();
        await invite.save();
        const inviteLink = buildInviteLink(invite.token);
        try {
            await sendExternalInviteEmail({
                recipientEmail: normalizedEmail,
                inviterName: requester.fullname,
                workspaceName: workspace.name,
                inviteLink,
            });
        } catch (emailError) {
            console.error('Email send failed:', emailError);
            await invite.deleteOne();
            const err = new Error('Invite email could not be sent. Please verify the recipient address and try again.');
            err.status = 502;
            throw err;
        }
        await invite.populate('invitedBy', 'fullname email avatar');
        return { message: 'Invite sent successfully', invite, emailDelivered: true };
    }

    // Existing user path
    const { invite, emailDelivered } = await createInternalInvite({
        workspaceId,
        normalizedEmail,
        invitedBy: requester._id,
        inviteRole,
        workspace,
        existingUser,
        io,
        requesterFullname: requester.fullname,
    });

    await invite.populate('invitedBy', 'fullname email avatar');

    if (!emailDelivered) {
        return {
            message: 'Invite was created, but email delivery failed. The user can still accept from in-app notifications.',
            invite,
            emailDelivered: false,
            httpStatus: 202,
        };
    }

    return { message: 'Invite sent successfully', invite, emailDelivered: true };
};

/**
 * Get pending invites for the current user.
 */
export const getMyInvites = async (userId, userEmail) => {
    return Invite.find({
        $or: [
            { invitedUser: userId, status: 'pending' },
            { email: userEmail, status: 'pending' },
        ],
    })
        .populate('workspace', 'name description')
        .populate('invitedBy', 'fullname email avatar')
        .sort('-createdAt');
};

/**
 * Get all invites for a workspace (admin/owner only).
 */
export const getWorkspaceInvites = async (workspaceId, requesterId) => {
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
        const err = new Error('Workspace not found');
        err.status = 404;
        throw err;
    }

    const requester = workspace.members.find(
        (m) => m.user.toString() === requesterId.toString()
    );
    if (!requester || !['owner', 'admin'].includes(requester.role)) {
        const err = new Error('Only owners and admins can view invites');
        err.status = 403;
        throw err;
    }

    return Invite.find({ workspace: workspaceId })
        .populate('invitedBy', 'fullname email')
        .populate('invitedUser', 'fullname email avatar')
        .sort('-createdAt');
};

/**
 * Accept an invite by invite ID.
 */
export const acceptInvite = async (inviteId, user, io) => {
    const invite = await Invite.findById(inviteId)
        .populate('workspace')
        .populate('invitedBy', 'fullname');

    if (!invite) {
        const err = new Error('Invite not found');
        err.status = 404;
        throw err;
    }
    if (invite.status !== 'pending') {
        const err = new Error(`Invite already ${invite.status}`);
        err.status = 400;
        throw err;
    }
    if (invite.isExpired()) {
        invite.status = 'expired';
        await invite.save();
        const err = new Error('Invite has expired');
        err.status = 400;
        throw err;
    }

    // Verify recipient
    if (invite.invitedUser && invite.invitedUser.toString() !== user._id.toString()) {
        const err = new Error('This invite is for a different user');
        err.status = 403;
        throw err;
    }
    if (!invite.invitedUser && invite.email !== user.email) {
        const err = new Error('This invite is for a different email');
        err.status = 403;
        throw err;
    }

    const workspace = await Workspace.findById(invite.workspace._id);
    if (!workspace) {
        const err = new Error('Workspace not found');
        err.status = 404;
        throw err;
    }

    // Already a member?
    const existingMember = workspace.members.find(
        (m) => m.user.toString() === user._id.toString()
    );
    if (existingMember) {
        invite.status = 'accepted';
        await invite.save();
        const err = new Error('You are already a member of this workspace');
        err.status = 400;
        throw err;
    }

    assertMemberLimit(workspace);

    workspace.members.push({ user: user._id, role: invite.role, joinedAt: new Date() });
    await workspace.save();

    invite.status = 'accepted';
    invite.invitedUser = user._id;
    await invite.save();

    // Notify inviter
    await Notification.create({
        recipient: invite.invitedBy._id,
        sender: user._id,
        message: `accepted your invite to join "${workspace.name}"`,
        type: 'invite_accepted',
        relatedId: workspace._id,
    });

    io.to(`user_${invite.invitedBy._id.toString()}`).emit('new_notification', {
        recipient: invite.invitedBy._id.toString(),
        sender: { fullname: user.fullname, avatar: user.avatar },
        message: `accepted your invite to join "${workspace.name}"`,
        type: 'invite_accepted',
        relatedId: workspace._id,
        createdAt: new Date(),
    });

    io.to(`workspace_${workspace._id.toString()}`).emit('member_joined', {
        workspace: workspace._id,
        member: {
            user: user._id,
            fullname: user.fullname,
            avatar: user.avatar,
            role: invite.role,
        },
    });

    io.to(`user_${user._id.toString()}`).emit('fetch_workspaces');

    await workspace.populate('members.user', 'fullname email avatar');
    return workspace;
};

/**
 * Decline an invite by invite ID.
 */
export const declineInvite = async (inviteId, user) => {
    const invite = await Invite.findById(inviteId);
    if (!invite) {
        const err = new Error('Invite not found');
        err.status = 404;
        throw err;
    }
    if (invite.status !== 'pending') {
        const err = new Error(`Invite already ${invite.status}`);
        err.status = 400;
        throw err;
    }
    if (invite.invitedUser && invite.invitedUser.toString() !== user._id.toString()) {
        const err = new Error('This invite is for a different user');
        err.status = 403;
        throw err;
    }
    if (!invite.invitedUser && invite.email !== user.email) {
        const err = new Error('This invite is for a different email');
        err.status = 403;
        throw err;
    }

    invite.status = 'declined';
    await invite.save();
};

/**
 * Cancel an invite (admin/owner only).
 */
export const cancelInvite = async (inviteId, requesterId) => {
    const invite = await Invite.findById(inviteId);
    if (!invite) {
        const err = new Error('Invite not found');
        err.status = 404;
        throw err;
    }

    const workspace = await Workspace.findById(invite.workspace);
    const requester = workspace.members.find(
        (m) => m.user.toString() === requesterId.toString()
    );
    if (!requester || !['owner', 'admin'].includes(requester.role)) {
        const err = new Error('Only owners and admins can cancel invites');
        err.status = 403;
        throw err;
    }

    await invite.deleteOne();
};

/**
 * Verify an invite token (for external users arriving from email link).
 */
export const verifyInviteToken = async (token) => {
    const invite = await Invite.findOne({ token, status: 'pending' })
        .populate('workspace', 'name description')
        .populate('invitedBy', 'fullname email');

    if (!invite) {
        const err = new Error('Invalid or expired invite');
        err.status = 404;
        throw err;
    }
    if (invite.isExpired()) {
        invite.status = 'expired';
        await invite.save();
        const err = new Error('Invite has expired');
        err.status = 400;
        throw err;
    }

    return {
        email: invite.email,
        workspace: invite.workspace,
        invitedBy: invite.invitedBy,
        role: invite.role,
        expiresAt: invite.expiresAt,
    };
};

/**
 * Accept an invite via token (after registration/login).
 */
export const acceptInviteByToken = async (token, user, io) => {
    const invite = await Invite.findOne({ token, status: 'pending' });
    if (!invite) {
        const err = new Error('Invalid or expired invite');
        err.status = 404;
        throw err;
    }
    if (invite.isExpired()) {
        invite.status = 'expired';
        await invite.save();
        const err = new Error('Invite has expired');
        err.status = 400;
        throw err;
    }
    if (invite.email !== user.email) {
        const err = new Error('Email mismatch');
        err.status = 403;
        throw err;
    }

    const workspace = await Workspace.findById(invite.workspace);
    if (!workspace) {
        const err = new Error('Workspace not found');
        err.status = 404;
        throw err;
    }

    assertMemberLimit(workspace);

    workspace.members.push({ user: user._id, role: invite.role, joinedAt: new Date() });
    await workspace.save();

    invite.status = 'accepted';
    invite.invitedUser = user._id;
    await invite.save();

    if (io) {
        io.to(`user_${user._id.toString()}`).emit('fetch_workspaces');
    }

    await workspace.populate('members.user', 'fullname email avatar');
    return workspace;
};
