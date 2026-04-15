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

const getIo = (req) => req.app.get('io');

// POST /api/invites
export const sendInvite = async (req, res) => {
    try {
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
    } catch (error) {
        res.status(error.status || 500).json({
            message: error.message || 'Server Error',
            ...(error.code && { code: error.code }),
            ...(error.limit !== undefined && { limit: error.limit }),
            ...(error.currentCount !== undefined && { currentCount: error.currentCount }),
        });
    }
};

// GET /api/invites/me
export const getMyInvites = async (req, res) => {
    try {
        const invites = await getMyInvitesService(req.user._id, req.user.email);
        res.json(invites);
    } catch (error) {
        res.status(error.status || 500).json({ message: error.message || 'Server Error' });
    }
};

// GET /api/invites/workspace/:workspaceId
export const getWorkspaceInvites = async (req, res) => {
    try {
        const invites = await getWorkspaceInvitesService(
            req.params.workspaceId,
            req.user._id
        );
        res.json(invites);
    } catch (error) {
        res.status(error.status || 500).json({ message: error.message || 'Server Error' });
    }
};

// POST /api/invites/:inviteId/accept
export const acceptInvite = async (req, res) => {
    try {
        const workspace = await acceptInviteService(
            req.params.inviteId,
            req.user,
            getIo(req)
        );
        res.json({ message: 'Invite accepted successfully', workspace });
    } catch (error) {
        res.status(error.status || 500).json({ message: error.message || 'Server Error' });
    }
};

// POST /api/invites/:inviteId/decline
export const declineInvite = async (req, res) => {
    try {
        await declineInviteService(req.params.inviteId, req.user);
        res.json({ message: 'Invite declined' });
    } catch (error) {
        res.status(error.status || 500).json({ message: error.message || 'Server Error' });
    }
};

// DELETE /api/invites/:inviteId
export const cancelInvite = async (req, res) => {
    try {
        await cancelInviteService(req.params.inviteId, req.user._id);
        res.json({ message: 'Invite cancelled' });
    } catch (error) {
        res.status(error.status || 500).json({ message: error.message || 'Server Error' });
    }
};

// GET /api/invites/token/:token
export const verifyInviteToken = async (req, res) => {
    try {
        const inviteData = await verifyInviteTokenService(req.params.token);
        res.json({ invite: inviteData });
    } catch (error) {
        res.status(error.status || 500).json({ message: error.message || 'Server Error' });
    }
};

// POST /api/invites/token/:token/accept
export const acceptInviteByToken = async (req, res) => {
    try {
        const workspace = await acceptInviteByTokenService(
            req.params.token,
            req.user,
            getIo(req)
        );
        res.json({ message: 'Invite accepted successfully', workspace });
    } catch (error) {
        res.status(error.status || 500).json({ message: error.message || 'Server Error' });
    }
};
