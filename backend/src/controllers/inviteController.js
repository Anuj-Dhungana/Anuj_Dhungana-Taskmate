import {
    sendInvite as sendInviteService,
    getMyInvites as getMyInvitesService,
    getWorkspaceInvites as getWorkspaceInvitesService,
    acceptInvite as acceptInviteService,
    declineInvite as declineInviteService,
    cancelInvite as cancelInviteService,
    verifyInviteToken as verifyInviteTokenService,
    acceptInviteByToken as acceptInviteByTokenService,
} from '../services/inviteService.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const getIo = (req) => req.app.get('io');

// POST /api/invites
export const sendInvite = asyncHandler(async (req, res) => {
    const { workspaceId, email, role } = req.body;
    const result = await sendInviteService({
        workspaceId,
        email,
        role,
        requester: req.user,
        io: getIo(req),
    });
    const httpStatus = result.httpStatus || 201;
    delete result.httpStatus;
    res.status(httpStatus).json(result);
});

// GET /api/invites/me
export const getMyInvites = asyncHandler(async (req, res) => {
    const invites = await getMyInvitesService(req.user._id, req.user.email);
    res.json(invites);
});

// GET /api/invites/workspace/:workspaceId
export const getWorkspaceInvites = asyncHandler(async (req, res) => {
    const invites = await getWorkspaceInvitesService(
        req.params.workspaceId,
        req.user._id
    );
    res.json(invites);
});

// POST /api/invites/:inviteId/accept
export const acceptInvite = asyncHandler(async (req, res) => {
    const workspace = await acceptInviteService(
        req.params.inviteId,
        req.user,
        getIo(req)
    );
    res.json({ message: 'Invite accepted successfully', workspace });
});

// POST /api/invites/:inviteId/decline
export const declineInvite = asyncHandler(async (req, res) => {
    await declineInviteService(req.params.inviteId, req.user);
    res.json({ message: 'Invite declined' });
});

// DELETE /api/invites/:inviteId
export const cancelInvite = asyncHandler(async (req, res) => {
    await cancelInviteService(req.params.inviteId, req.user._id);
    res.json({ message: 'Invite cancelled' });
});

// GET /api/invites/token/:token
export const verifyInviteToken = asyncHandler(async (req, res) => {
    const inviteData = await verifyInviteTokenService(req.params.token);
    res.json({ invite: inviteData });
});

// POST /api/invites/token/:token/accept
export const acceptInviteByToken = asyncHandler(async (req, res) => {
    const workspace = await acceptInviteByTokenService(
        req.params.token,
        req.user,
        getIo(req)
    );
    res.json({ message: 'Invite accepted successfully', workspace });
});
