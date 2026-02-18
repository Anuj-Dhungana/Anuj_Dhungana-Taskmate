import Invite from '../models/Invite.js';
import Workspace from '../models/Workspace.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import sendEmail from '../utils/sendEmail.js';

// Send invite to join workspace
export const sendInvite = async (req, res) => {
    try {
        const { workspaceId, email, role = 'member' } = req.body;

        if (!workspaceId || !email) {
            return res.status(400).json({ message: "workspaceId and email are required" });
        }

        // Validate role
        if (!['member', 'admin'].includes(role)) {
            return res.status(400).json({ message: "Invalid role. Must be 'member' or 'admin'" });
        }

        // Check workspace exists
        const workspace = await Workspace.findById(workspaceId).populate('members.user', 'fullname email');
        if (!workspace) {
            return res.status(404).json({ message: "Workspace not found" });
        }

        // Check if requester is owner or admin
        const requester = workspace.members.find(m => m.user && m.user._id.toString() === req.user._id.toString());
        if (!requester || !['owner', 'admin'].includes(requester.role)) {
            return res.status(403).json({ message: "Only owners and admins can invite members" });
        }

        // Check if user is already a member
        const existingMember = workspace.members.find(m => m.user && m.user.email === email.toLowerCase());
        if (existingMember) {
            return res.status(400).json({ message: "User is already a member of this workspace" });
        }

        // Check for existing pending invite
        const existingInvite = await Invite.findOne({
            workspace: workspaceId,
            email: email.toLowerCase(),
            status: 'pending'
        });
        if (existingInvite) {
            return res.status(400).json({ message: "An invite is already pending for this email" });
        }

        // Check if email belongs to existing user
        const existingUser = await User.findOne({ email: email.toLowerCase() });

        // Create invite
        const invite = await Invite.create({
            workspace: workspaceId,
            email: email.toLowerCase(),
            invitedBy: req.user._id,
            role,
            invitedUser: existingUser?._id || null,
        });

        // If external user (no account), generate token
        if (!existingUser) {
            invite.generateToken();
            await invite.save();

            // Send email with invite link
            const inviteLink = `${process.env.FRONTEND_URL}/invite/${invite.token}`;
            try {
                await sendEmail({
                    email: email.toLowerCase(),
                    subject: `You've been invited to ${workspace.name}`,
                    html: `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                            <h2 style="color: #6366F1;">Workspace Invitation</h2>
                            <p>${req.user.fullname} has invited you to join <strong>${workspace.name}</strong> on TaskMate.</p>
                            <p>Click the button below to accept:</p>
                            <a href="${inviteLink}" style="display: inline-block; padding: 12px 24px; background: #6366F1; color: white; text-decoration: none; border-radius: 8px; margin: 20px 0;">Accept Invite</a>
                            <p style="color: #666; font-size: 14px;">This invite will expire in 72 hours.</p>
                            <p style="color: #666; font-size: 14px;">If you don't have an account, you'll be asked to register first.</p>
                            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                            <p style="color: #999; font-size: 12px;">Or copy and paste this link: ${inviteLink}</p>
                        </div>
                    `
                });
            } catch (emailError) {
                console.error('Email send failed:', emailError);
                // Continue even if email fails
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
            const inviteLink = `${process.env.FRONTEND_URL}/dashboard`;
            try {
                await sendEmail({
                    email: existingUser.email,
                    subject: `You've been invited to ${workspace.name}`,
                    html: `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                            <h2 style="color: #6366F1;">Workspace Invitation</h2>
                            <p>Hi ${existingUser.fullname},</p>
                            <p>${req.user.fullname} has invited you to join <strong>${workspace.name}</strong> on TaskMate as a <strong>${role}</strong>.</p>
                            <p>Click the button below to view and accept your invitation:</p>
                            <a href="${inviteLink}" style="display: inline-block; padding: 12px 24px; background: #6366F1; color: white; text-decoration: none; border-radius: 8px; margin: 20px 0;">View Invitation</a>
                            <p style="color: #666; font-size: 14px;">This invite will expire in 72 hours.</p>
                            <p style="color: #666; font-size: 14px;">You can also find this invitation in your TaskMate inbox.</p>
                            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                            <p style="color: #999; font-size: 12px;">Or copy and paste this link: ${inviteLink}</p>
                        </div>
                    `
                });
            } catch (emailError) {
                console.error('Email send to existing user failed:', emailError);
                // Continue even if email fails
            }
        }

        await invite.populate('invitedBy', 'fullname email avatar');
        res.status(201).json({ 
            message: "Invite sent successfully", 
            invite 
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
        const existingMember = workspace.members.find(m => m.user.toString() === req.user._id.toString());
        if (existingMember) {
            invite.status = 'accepted';
            await invite.save();
            return res.status(400).json({ message: "You are already a member of this workspace" });
        }

        // Add user to workspace
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
