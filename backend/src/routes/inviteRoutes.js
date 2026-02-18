import express from 'express';
import protect from '../middleware/authMiddleware.js';
import {
    sendInvite,
    getMyInvites,
    getWorkspaceInvites,
    acceptInvite,
    declineInvite,
    cancelInvite,
    verifyInviteToken,
    acceptInviteByToken
} from '../controllers/inviteController.js';

const router = express.Router();

// Send invite to join workspace
router.post('/send', protect, sendInvite);

// Get my pending invites
router.get('/my-invites', protect, getMyInvites);

// Get all invites for a workspace (admin/owner only)
router.get('/workspace/:workspaceId', protect, getWorkspaceInvites);

// Accept invite
router.post('/:inviteId/accept', protect, acceptInvite);

// Decline invite
router.post('/:inviteId/decline', protect, declineInvite);

// Cancel invite (admin/owner only)
router.delete('/:inviteId', protect, cancelInvite);

// Verify invite token (public - for external users)
router.get('/verify/:token', verifyInviteToken);

// Accept invite by token (after registration)
router.post('/accept-token/:token', protect, acceptInviteByToken);

export default router;
