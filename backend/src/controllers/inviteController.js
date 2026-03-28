import Invite from '../models/Invite.js';
import Workspace from '../models/Workspace.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import sendEmail from '../utils/sendEmail.js';
import { canAddMembersToWorkspace } from '../services/workspacePlanService.js';

const getFrontendBaseUrl = () =>
    String(process.env.FRONTEND_URL || 'http://localhost:5173')
        .trim()
        .replace(/\/+$/, '');

const sendExternalInviteEmail = async ({ recipientEmail, inviterName, workspaceName, inviteLink }) =>
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

const sendExistingUserInviteEmail = async ({ recipientEmail, recipientName, inviterName, workspaceName, inviteRole, inviteLink }) =>
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

// Send invite to join workspace
export const sendInvite = async (req, res) => {
    try {
        const { workspaceId, email, role } = req.body;
        const normalizedEmail = String(email || '').toLowerCase().trim();

        if (!workspaceId || !normalizedEmail) {
            return res.status(400).json({ message: "workspaceId and email are required" });
        }

        // Check workspace exists
        const workspace = await Workspace.findById(workspaceId).populate('members.user', 'fullname email');
        if (!workspace) {
            return res.status(404).json({ message: "Workspace not found" });
        }

        const inviteRole = role || workspace.settings?.access?.defaultInviteRole || 'member';
        if (!['member', 'admin'].includes(inviteRole)) {
            return res.status(400).json({ message: "Invalid role. Must be 'member' or 'admin'" });
        }

        // Check if requester is owner or admin
        const requester = workspace.members.find(m => m.user && m.user._id.toString() === req.user._id.toString());
        if (!requester || !['owner', 'admin'].includes(requester.role)) {
            return res.status(403).json({ message: "Only owners and admins can invite members" });
        }

        const memberAllowance = canAddMembersToWorkspace(workspace, 1);
        if (!memberAllowance.allowed) {
            return res.status(403).json({
                code: 'MEMBER_LIMIT_REACHED',
                message: `Free plan allows up to ${memberAllowance.limit} members in this workspace. Upgrade to Pro for unlimited members.`,
                limit: memberAllowance.limit,
                currentCount: memberAllowance.currentMembers,
            });
        }

        // Admins can only invite as 'member' — only owners can invite as 'admin'
        if (requester.role === 'admin' && inviteRole === 'admin') {
            return res.status(403).json({ message: "Only owners can invite members with admin role" });
        }

        // Check if user is already a member
        const existingMember = workspace.members.find(m => m.user && m.user.email === normalizedEmail);
        if (existingMember) {
            return res.status(400).json({ message: "User is already a member of this workspace" });
        }

        // Check if email belongs to existing user
        const existingUser = await User.findOne({ email: normalizedEmail });

        // Check for existing pending invite
        let existingInvite = await Invite.findOne({
            workspace: workspaceId,
            email: normalizedEmail,
            status: 'pending'
        });

        if (existingInvite && existingInvite.isExpired()) {
            existingInvite.status = 'expired';
            await existingInvite.save();
            existingInvite = null;
        }

        if (existingInvite) {
            try {
                if (existingUser) {
                    const inviteLink = `${getFrontendBaseUrl()}/dashboard`;
                    await sendExistingUserInviteEmail({
                        recipientEmail: existingUser.email,
                        recipientName: existingUser.fullname || 'there',
                        inviterName: req.user.fullname,
                        workspaceName: workspace.name,
                        inviteRole,
                        inviteLink,
                    });
                } else {
                    if (!existingInvite.token) {
                        existingInvite.generateToken();
                        await existingInvite.save();
                    }
                    const inviteLink = `${getFrontendBaseUrl()}/invite/${existingInvite.token}`;
                    await sendExternalInviteEmail({
                        recipientEmail: normalizedEmail,
                        inviterName: req.user.fullname,
                        workspaceName: workspace.name,
                        inviteLink,
                    });
                }

                await existingInvite.populate('invitedBy', 'fullname email avatar');
                return res.status(200).json({
                    message: 'An invite is already pending for this email. Invite email has been resent.',
                    invite: existingInvite,
                    resent: true,
                    emailDelivered: true,
                });
            } catch (emailError) {
                console.error('Invite resend email failed:', emailError);
                return res.status(502).json({
                    message: 'An invite is pending, but the email could not be resent. Please try again shortly.',
                });
            }
        }

        // Create invite
        const invite = await Invite.create({
            workspace: workspaceId,
            email: normalizedEmail,
            invitedBy: req.user._id,
            role: inviteRole,
            invitedUser: existingUser?._id || null,
        });

        // If external user (no account), generate token
        if (!existingUser) {
            invite.generateToken();
            await invite.save();

            // Send email with invite link
            const inviteLink = `${getFrontendBaseUrl()}/invite/${invite.token}`;
            try {
                await sendExternalInviteEmail({
                    recipientEmail: normalizedEmail,
                    inviterName: req.user.fullname,
                    workspaceName: workspace.name,
                    inviteLink,
                });
            } catch (emailError) {
                console.error('Email send failed:', emailError);
                await invite.deleteOne();
                return res.status(502).json({
                    message: 'Invite email could not be sent. Please verify the recipient address and try again.',
                });
            }
        } else {
            // Internal user - create notification
            await Notification.create({
                recipient: existingUser._id,
                sender: req.user._id,
                message: `invited you to join workspace "${workspace.name}"`,
                type: 'workspace_invite',
                relatedId: invite._id
            });

            // Real-time notification
            const io = req.app.get('io');
            io.to(`user_${existingUser._id.toString()}`).emit("new_notification", {
                recipient: existingUser._id.toString(),
                sender: { fullname: req.user.fullname },
                message: `invited you to join workspace "${workspace.name}"`,
                type: 'workspace_invite',
                relatedId: invite._id
            });

            // Send email to existing user as well
            const inviteLink = `${getFrontendBaseUrl()}/dashboard`;
            try {
                await sendExistingUserInviteEmail({
                    recipientEmail: existingUser.email,
                    recipientName: existingUser.fullname || 'there',
                    inviterName: req.user.fullname,
                    workspaceName: workspace.name,
                    inviteRole,
                    inviteLink,
                });
            } catch (emailError) {
                console.error('Email send to existing user failed:', emailError);
                await invite.populate('invitedBy', 'fullname email avatar');
                return res.status(202).json({
                    message: 'Invite was created, but email delivery failed. The user can still accept from in-app notifications.',
                    invite,
                    emailDelivered: false,
                });
            }
        }

        await invite.populate('invitedBy', 'fullname email avatar');
        res.status(201).json({ 
            message: "Invite sent successfully", 
            invite,
            emailDelivered: true,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error" });
    }
};

// Get all pending invites for current user
export const getMyInvites = async (req, res) => {
    try {
        const invites = await Invite.find({
            $or: [
                { invitedUser: req.user._id, status: 'pending' },
                { email: req.user.email, status: 'pending' }
            ]
        })
        .populate('workspace', 'name description')
        .populate('invitedBy', 'fullname email avatar')
        .sort('-createdAt');

        res.json(invites);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error" });
    }
};

// Get all invites for a workspace (admin/owner only)
export const getWorkspaceInvites = async (req, res) => {
    try {
        const { workspaceId } = req.params;

        const workspace = await Workspace.findById(workspaceId);
        if (!workspace) {
            return res.status(404).json({ message: "Workspace not found" });
        }

        // Check if requester is owner or admin
        const requester = workspace.members.find(m => m.user.toString() === req.user._id.toString());
        if (!requester || !['owner', 'admin'].includes(requester.role)) {
            return res.status(403).json({ message: "Only owners and admins can view invites" });
        }

        const invites = await Invite.find({ workspace: workspaceId })
            .populate('invitedBy', 'fullname email')
            .populate('invitedUser', 'fullname email avatar')
            .sort('-createdAt');

        res.json(invites);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error" });
    }
};

// Accept invite
export const acceptInvite = async (req, res) => {
    try {
        const { inviteId } = req.params;

        const invite = await Invite.findById(inviteId)
            .populate('workspace')
            .populate('invitedBy', 'fullname');

        if (!invite) {
            return res.status(404).json({ message: "Invite not found" });
        }

        if (invite.status !== 'pending') {
            return res.status(400).json({ message: `Invite already ${invite.status}` });
        }

        if (invite.isExpired()) {
            invite.status = 'expired';
            await invite.save();
            return res.status(400).json({ message: "Invite has expired" });
        }

        // Verify user is the intended recipient
        if (invite.invitedUser && invite.invitedUser.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "This invite is for a different user" });
        }
        if (!invite.invitedUser && invite.email !== req.user.email) {
            return res.status(403).json({ message: "This invite is for a different email" });
        }

        // Check if already a member
        const workspace = await Workspace.findById(invite.workspace._id);
        if (!workspace) {
            return res.status(404).json({ message: "Workspace not found" });
        }
        const existingMember = workspace.members.find(m => m.user.toString() === req.user._id.toString());
        if (existingMember) {
            invite.status = 'accepted';
            await invite.save();
            return res.status(400).json({ message: "You are already a member of this workspace" });
        }

        // Add user to workspace
        const memberAllowance = canAddMembersToWorkspace(workspace, 1);
        if (!memberAllowance.allowed) {
            return res.status(403).json({
                code: 'MEMBER_LIMIT_REACHED',
                message: `Free plan allows up to ${memberAllowance.limit} members in this workspace. Upgrade to Pro for unlimited members.`,
                limit: memberAllowance.limit,
                currentCount: memberAllowance.currentMembers,
            });
        }

        workspace.members.push({
            user: req.user._id,
            role: invite.role,
            joinedAt: new Date()
        });
        await workspace.save();

        // Update invite status
        invite.status = 'accepted';
        invite.invitedUser = req.user._id;
        await invite.save();

        // Notify inviter
        await Notification.create({
            recipient: invite.invitedBy._id,
            sender: req.user._id,
            message: `accepted your invite to join "${workspace.name}"`,
            type: 'invite_accepted',
            relatedId: workspace._id
        });

        // Emit real-time event
        const io = req.app.get('io');
        io.to(`workspace_${workspace._id.toString()}`).emit('member_joined', {
            workspace: workspace._id,
            member: {
                user: req.user._id,
                fullname: req.user.fullname,
                avatar: req.user.avatar,
                role: invite.role
            }
        });

        await workspace.populate('members.user', 'fullname email avatar');
        res.json({ 
            message: "Invite accepted successfully", 
            workspace 
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error" });
    }
};

// Decline invite
export const declineInvite = async (req, res) => {
    try {
        const { inviteId } = req.params;

        const invite = await Invite.findById(inviteId);
        if (!invite) {
            return res.status(404).json({ message: "Invite not found" });
        }

        if (invite.status !== 'pending') {
            return res.status(400).json({ message: `Invite already ${invite.status}` });
        }

        // Verify user is the intended recipient
        if (invite.invitedUser && invite.invitedUser.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "This invite is for a different user" });
        }
        if (!invite.invitedUser && invite.email !== req.user.email) {
            return res.status(403).json({ message: "This invite is for a different email" });
        }

        invite.status = 'declined';
        await invite.save();

        res.json({ message: "Invite declined" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error" });
    }
};

// Cancel invite (admin/owner only)
export const cancelInvite = async (req, res) => {
    try {
        const { inviteId } = req.params;

        const invite = await Invite.findById(inviteId);
        if (!invite) {
            return res.status(404).json({ message: "Invite not found" });
        }

        // Check if requester is owner or admin of workspace
        const workspace = await Workspace.findById(invite.workspace);
        const requester = workspace.members.find(m => m.user.toString() === req.user._id.toString());
        if (!requester || !['owner', 'admin'].includes(requester.role)) {
            return res.status(403).json({ message: "Only owners and admins can cancel invites" });
        }

        await invite.deleteOne();
        res.json({ message: "Invite cancelled" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error" });
    }
};

// Verify invite token (for external users from email link)
export const verifyInviteToken = async (req, res) => {
    try {
        const { token } = req.params;

        const invite = await Invite.findOne({ token, status: 'pending' })
            .populate('workspace', 'name description')
            .populate('invitedBy', 'fullname email');

        if (!invite) {
            return res.status(404).json({ message: "Invalid or expired invite" });
        }

        if (invite.isExpired()) {
            invite.status = 'expired';
            await invite.save();
            return res.status(400).json({ message: "Invite has expired" });
        }

        res.json({ 
            invite: {
                email: invite.email,
                workspace: invite.workspace,
                invitedBy: invite.invitedBy,
                role: invite.role,
                expiresAt: invite.expiresAt
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error" });
    }
};

// Accept invite via token (after registration)
export const acceptInviteByToken = async (req, res) => {
    try {
        const { token } = req.params;

        const invite = await Invite.findOne({ token, status: 'pending' });
        if (!invite) {
            return res.status(404).json({ message: "Invalid or expired invite" });
        }

        if (invite.isExpired()) {
            invite.status = 'expired';
            await invite.save();
            return res.status(400).json({ message: "Invite has expired" });
        }

        // Verify email matches
        if (invite.email !== req.user.email) {
            return res.status(403).json({ message: "Email mismatch" });
        }

        // Add user to workspace
        const workspace = await Workspace.findById(invite.workspace);
        if (!workspace) {
            return res.status(404).json({ message: "Workspace not found" });
        }
        const memberAllowance = canAddMembersToWorkspace(workspace, 1);
        if (!memberAllowance.allowed) {
            return res.status(403).json({
                code: 'MEMBER_LIMIT_REACHED',
                message: `Free plan allows up to ${memberAllowance.limit} members in this workspace. Upgrade to Pro for unlimited members.`,
                limit: memberAllowance.limit,
                currentCount: memberAllowance.currentMembers,
            });
        }

        workspace.members.push({
            user: req.user._id,
            role: invite.role,
            joinedAt: new Date()
        });
        await workspace.save();

        // Update invite
        invite.status = 'accepted';
        invite.invitedUser = req.user._id;
        await invite.save();

        await workspace.populate('members.user', 'fullname email avatar');
        res.json({ 
            message: "Invite accepted successfully", 
            workspace 
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error" });
    }
};
