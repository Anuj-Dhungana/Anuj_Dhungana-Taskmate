import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
    Invite: {
        findOne: vi.fn(),
        create: vi.fn(),
        find: vi.fn(),
        findById: vi.fn(),
    },
    Workspace: {
        findById: vi.fn(),
    },
    User: {
        findOne: vi.fn(),
    },
    Notification: {
        create: vi.fn(),
    },
    sendEmail: vi.fn(),
    workspacePlanService: {
        canAddMembersToWorkspace: vi.fn(),
    },
}));

vi.mock('../../models/Invite.js', () => ({
    default: mocks.Invite,
}));

vi.mock('../../models/Workspace.js', () => ({
    default: mocks.Workspace,
}));

vi.mock('../../models/User.js', () => ({
    default: mocks.User,
}));

vi.mock('../../models/Notification.js', () => ({
    default: mocks.Notification,
}));

vi.mock('../../utils/sendEmail.js', () => ({
    default: mocks.sendEmail,
}));

vi.mock('../../services/workspacePlanService.js', () => ({
    canAddMembersToWorkspace: mocks.workspacePlanService.canAddMembersToWorkspace,
}));

import {
    acceptInvite,
    acceptInviteByToken,
    cancelInvite,
    declineInvite,
    getMyInvites,
    getWorkspaceInvites,
    sendInvite,
    verifyInviteToken,
} from '../inviteController.js';

const createMockResponse = () => {
    const res = {};
    res.status = vi.fn().mockReturnValue(res);
    res.json = vi.fn().mockReturnValue(res);
    return res;
};

const createMockIo = () => {
    const emit = vi.fn();
    const to = vi.fn().mockReturnValue({ emit });
    return { to, emit };
};

const createMockRequest = (overrides = {}) => {
    const io = createMockIo();
    return {
        params: {},
        body: {},
        query: {},
        user: {
            _id: 'user-1',
            email: 'owner@example.com',
            fullname: 'Owner User',
            avatar: 'avatar.png',
        },
        app: {
            get: vi.fn().mockReturnValue(io),
        },
        ...overrides,
    };
};

const createInviteFindQuery = (result) => {
    const query = {
        populate: vi.fn(),
        sort: vi.fn(),
    };
    query.populate.mockReturnValue(query);
    query.sort.mockResolvedValue(result);
    return query;
};

const createTwoPopulateQuery = (result) => {
    const secondPopulate = vi.fn().mockResolvedValue(result);
    const firstPopulate = vi.fn().mockReturnValue({ populate: secondPopulate });

    return {
        query: { populate: firstPopulate },
        firstPopulate,
        secondPopulate,
    };
};

const mockWorkspacePopulateLookup = (workspace) => {
    const populate = vi.fn().mockResolvedValue(workspace);
    mocks.Workspace.findById.mockReturnValue({ populate });
    return populate;
};

const createSendInviteWorkspace = (overrides = {}) => ({
    _id: 'workspace-1',
    name: 'Alpha',
    settings: {
        access: {
            defaultInviteRole: 'member',
        },
    },
    members: [
        {
            user: { _id: 'user-1', email: 'owner@example.com' },
            role: 'owner',
        },
    ],
    ...overrides,
});

describe('inviteController', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.workspacePlanService.canAddMembersToWorkspace.mockReturnValue({
            allowed: true,
            limit: null,
            currentMembers: 1,
        });
    });

    describe('sendInvite', () => {
        it('returns 400 when workspaceId or email is missing', async () => {
            // Arrange
            const req = createMockRequest({ body: {} });
            const res = createMockResponse();

            // Act
            await sendInvite(req, res);

            // Assert
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                message: 'workspaceId and email are required',
            });
        });

        it('returns 404 when workspace does not exist', async () => {
            // Arrange
            const req = createMockRequest({
                body: { workspaceId: 'workspace-1', email: 'new@example.com' },
            });
            const res = createMockResponse();
            const populate = mockWorkspacePopulateLookup(null);

            // Act
            await sendInvite(req, res);

            // Assert
            expect(mocks.Workspace.findById).toHaveBeenCalledWith('workspace-1');
            expect(populate).toHaveBeenCalledWith('members.user', 'fullname email');
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: 'Workspace not found' });
        });

        it('returns 403 when member limit is reached', async () => {
            // Arrange
            const req = createMockRequest({
                body: { workspaceId: 'workspace-1', email: 'new@example.com' },
            });
            const res = createMockResponse();
            const workspace = createSendInviteWorkspace();

            mockWorkspacePopulateLookup(workspace);
            mocks.workspacePlanService.canAddMembersToWorkspace.mockReturnValue({
                allowed: false,
                limit: 5,
                currentMembers: 5,
            });

            // Act
            await sendInvite(req, res);

            // Assert
            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({
                code: 'MEMBER_LIMIT_REACHED',
                message: 'Free plan allows up to 5 members in this workspace. Upgrade to Pro for unlimited members.',
                limit: 5,
                currentCount: 5,
            });
        });

        it('returns 403 when admin tries to invite another admin', async () => {
            // Arrange
            const req = createMockRequest({
                body: { workspaceId: 'workspace-1', email: 'new@example.com', role: 'admin' },
            });
            const res = createMockResponse();
            const workspace = createSendInviteWorkspace({
                members: [
                    {
                        user: { _id: 'user-1', email: 'owner@example.com' },
                        role: 'admin',
                    },
                ],
            });

            mockWorkspacePopulateLookup(workspace);

            // Act
            await sendInvite(req, res);

            // Assert
            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Only owners can invite members with admin role',
            });
        });

        it('resends existing pending invite for external email and returns 200', async () => {
            // Arrange
            const req = createMockRequest({
                body: { workspaceId: 'workspace-1', email: 'external@example.com' },
            });
            const res = createMockResponse();
            const workspace = createSendInviteWorkspace();

            const existingInvite = {
                _id: 'invite-1',
                token: '',
                status: 'pending',
                isExpired: vi.fn().mockReturnValue(false),
                generateToken: vi.fn(function generateToken() {
                    existingInvite.token = 'token-123';
                    return existingInvite.token;
                }),
                save: vi.fn().mockResolvedValue(undefined),
                populate: vi.fn().mockResolvedValue(undefined),
            };

            mockWorkspacePopulateLookup(workspace);
            mocks.User.findOne.mockResolvedValue(null);
            mocks.Invite.findOne.mockResolvedValue(existingInvite);
            mocks.sendEmail.mockResolvedValue({ ok: true });

            // Act
            await sendInvite(req, res);

            // Assert
            expect(existingInvite.generateToken).toHaveBeenCalledTimes(1);
            expect(existingInvite.save).toHaveBeenCalledTimes(1);
            expect(mocks.sendEmail).toHaveBeenCalledTimes(1);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    resent: true,
                    emailDelivered: true,
                    invite: existingInvite,
                })
            );
        });

        it('creates external invite and returns 502 if email sending fails', async () => {
            // Arrange
            const req = createMockRequest({
                body: { workspaceId: 'workspace-1', email: 'new.external@example.com' },
            });
            const res = createMockResponse();
            const workspace = createSendInviteWorkspace();
            const invite = {
                _id: 'invite-2',
                token: '',
                generateToken: vi.fn(function generateToken() {
                    invite.token = 'token-xyz';
                    return invite.token;
                }),
                save: vi.fn().mockResolvedValue(undefined),
                deleteOne: vi.fn().mockResolvedValue(undefined),
                populate: vi.fn().mockResolvedValue(undefined),
            };

            mockWorkspacePopulateLookup(workspace);
            mocks.User.findOne.mockResolvedValue(null);
            mocks.Invite.findOne.mockResolvedValue(null);
            mocks.Invite.create.mockResolvedValue(invite);
            mocks.sendEmail.mockRejectedValue(new Error('SMTP down'));

            // Act
            await sendInvite(req, res);

            // Assert
            expect(mocks.Invite.create).toHaveBeenCalledWith({
                workspace: 'workspace-1',
                email: 'new.external@example.com',
                invitedBy: 'user-1',
                role: 'member',
                invitedUser: null,
            });
            expect(invite.generateToken).toHaveBeenCalledTimes(1);
            expect(invite.save).toHaveBeenCalledTimes(1);
            expect(invite.deleteOne).toHaveBeenCalledTimes(1);
            expect(res.status).toHaveBeenCalledWith(502);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Invite email could not be sent. Please verify the recipient address and try again.',
            });
        });

        it('creates invite for existing user and returns 202 when email delivery fails', async () => {
            // Arrange
            const io = createMockIo();
            const req = createMockRequest({
                body: { workspaceId: 'workspace-1', email: 'member@example.com', role: 'member' },
                app: { get: vi.fn().mockReturnValue(io) },
            });
            const res = createMockResponse();
            const workspace = createSendInviteWorkspace();
            const existingUser = {
                _id: 'user-2',
                email: 'member@example.com',
                fullname: 'Member User',
            };
            const invite = {
                _id: 'invite-3',
                populate: vi.fn().mockResolvedValue(undefined),
            };

            mockWorkspacePopulateLookup(workspace);
            mocks.User.findOne.mockResolvedValue(existingUser);
            mocks.Invite.findOne.mockResolvedValue(null);
            mocks.Invite.create.mockResolvedValue(invite);
            mocks.Notification.create.mockResolvedValue({ _id: 'notif-1' });
            mocks.sendEmail.mockRejectedValue(new Error('Delivery failed'));

            // Act
            await sendInvite(req, res);

            // Assert
            expect(mocks.Notification.create).toHaveBeenCalledWith({
                recipient: 'user-2',
                sender: 'user-1',
                message: 'invited you to join workspace "Alpha"',
                type: 'workspace_invite',
                relatedId: 'invite-3',
            });
            expect(io.to).toHaveBeenCalledWith('user_user-2');
            expect(res.status).toHaveBeenCalledWith(202);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'Invite was created, but email delivery failed. The user can still accept from in-app notifications.',
                    invite,
                    emailDelivered: false,
                })
            );
        });
    });

    describe('getMyInvites', () => {
        it('returns current user pending invites with populate and sort', async () => {
            // Arrange
            const req = createMockRequest({
                user: {
                    _id: 'user-1',
                    email: 'owner@example.com',
                },
            });
            const res = createMockResponse();
            const invites = [{ _id: 'invite-1' }];
            const query = createInviteFindQuery(invites);

            mocks.Invite.find.mockReturnValue(query);

            // Act
            await getMyInvites(req, res);

            // Assert
            expect(mocks.Invite.find).toHaveBeenCalledWith({
                $or: [
                    { invitedUser: 'user-1', status: 'pending' },
                    { email: 'owner@example.com', status: 'pending' },
                ],
            });
            expect(query.populate).toHaveBeenNthCalledWith(1, 'workspace', 'name description');
            expect(query.populate).toHaveBeenNthCalledWith(2, 'invitedBy', 'fullname email avatar');
            expect(query.sort).toHaveBeenCalledWith('-createdAt');
            expect(res.json).toHaveBeenCalledWith(invites);
        });
    });

    describe('getWorkspaceInvites', () => {
        it('returns 403 when requester is not owner/admin', async () => {
            // Arrange
            const req = createMockRequest({ params: { workspaceId: 'workspace-1' } });
            const res = createMockResponse();

            mocks.Workspace.findById.mockResolvedValue({
                _id: 'workspace-1',
                members: [{ user: 'user-2', role: 'member' }],
            });

            // Act
            await getWorkspaceInvites(req, res);

            // Assert
            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Only owners and admins can view invites',
            });
        });

        it('returns workspace invites when requester is owner', async () => {
            // Arrange
            const req = createMockRequest({ params: { workspaceId: 'workspace-1' } });
            const res = createMockResponse();
            const invites = [{ _id: 'invite-2' }];
            const query = createInviteFindQuery(invites);

            mocks.Workspace.findById.mockResolvedValue({
                _id: 'workspace-1',
                members: [{ user: 'user-1', role: 'owner' }],
            });
            mocks.Invite.find.mockReturnValue(query);

            // Act
            await getWorkspaceInvites(req, res);

            // Assert
            expect(mocks.Invite.find).toHaveBeenCalledWith({ workspace: 'workspace-1' });
            expect(query.populate).toHaveBeenNthCalledWith(1, 'invitedBy', 'fullname email');
            expect(query.populate).toHaveBeenNthCalledWith(2, 'invitedUser', 'fullname email avatar');
            expect(query.sort).toHaveBeenCalledWith('-createdAt');
            expect(res.json).toHaveBeenCalledWith(invites);
        });
    });

    describe('acceptInvite', () => {
        it('returns 400 when invite is expired', async () => {
            // Arrange
            const req = createMockRequest({ params: { inviteId: 'invite-1' } });
            const res = createMockResponse();
            const invite = {
                _id: 'invite-1',
                status: 'pending',
                isExpired: vi.fn().mockReturnValue(true),
                save: vi.fn().mockResolvedValue(undefined),
            };
            const query = createTwoPopulateQuery(invite);

            mocks.Invite.findById.mockReturnValue(query.query);

            // Act
            await acceptInvite(req, res);

            // Assert
            expect(query.firstPopulate).toHaveBeenCalledWith('workspace');
            expect(query.secondPopulate).toHaveBeenCalledWith('invitedBy', 'fullname');
            expect(invite.status).toBe('expired');
            expect(invite.save).toHaveBeenCalledTimes(1);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: 'Invite has expired' });
        });

        it('returns 403 when invite is for a different user id', async () => {
            // Arrange
            const req = createMockRequest({ params: { inviteId: 'invite-1' } });
            const res = createMockResponse();
            const invite = {
                _id: 'invite-1',
                status: 'pending',
                invitedUser: { toString: () => 'user-999' },
                isExpired: vi.fn().mockReturnValue(false),
            };
            const query = createTwoPopulateQuery(invite);

            mocks.Invite.findById.mockReturnValue(query.query);

            // Act
            await acceptInvite(req, res);

            // Assert
            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({
                message: 'This invite is for a different user',
            });
        });

        it('accepts invite successfully and emits realtime events', async () => {
            // Arrange
            const io = createMockIo();
            const req = createMockRequest({
                params: { inviteId: 'invite-1' },
                user: {
                    _id: 'user-1',
                    email: 'member@example.com',
                    fullname: 'Member User',
                    avatar: 'member.png',
                },
                app: { get: vi.fn().mockReturnValue(io) },
            });
            const res = createMockResponse();

            const invite = {
                _id: 'invite-1',
                status: 'pending',
                email: 'member@example.com',
                invitedUser: null,
                role: 'member',
                workspace: { _id: 'workspace-1' },
                invitedBy: { _id: 'inviter-1' },
                isExpired: vi.fn().mockReturnValue(false),
                save: vi.fn().mockResolvedValue(undefined),
            };
            const workspace = {
                _id: 'workspace-1',
                name: 'Alpha',
                members: [],
                save: vi.fn().mockResolvedValue(undefined),
                populate: vi.fn().mockResolvedValue(undefined),
            };
            const query = createTwoPopulateQuery(invite);

            mocks.Invite.findById.mockReturnValue(query.query);
            mocks.Workspace.findById.mockResolvedValue(workspace);
            mocks.Notification.create.mockResolvedValue({ _id: 'notif-1' });

            // Act
            await acceptInvite(req, res);

            // Assert
            expect(workspace.members).toHaveLength(1);
            expect(workspace.members[0]).toEqual(
                expect.objectContaining({
                    user: 'user-1',
                    role: 'member',
                })
            );
            expect(workspace.save).toHaveBeenCalledTimes(1);
            expect(invite.status).toBe('accepted');
            expect(invite.invitedUser).toBe('user-1');
            expect(invite.save).toHaveBeenCalledTimes(1);
            expect(mocks.Notification.create).toHaveBeenCalledWith({
                recipient: 'inviter-1',
                sender: 'user-1',
                message: 'accepted your invite to join "Alpha"',
                type: 'invite_accepted',
                relatedId: 'workspace-1',
            });
            expect(io.to).toHaveBeenCalledWith('user_inviter-1');
            expect(io.to).toHaveBeenCalledWith('workspace_workspace-1');
            expect(io.to).toHaveBeenCalledWith('user_user-1');
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'Invite accepted successfully',
                    workspace,
                })
            );
        });
    });

    describe('declineInvite', () => {
        it('declines invite for intended recipient', async () => {
            // Arrange
            const req = createMockRequest({ params: { inviteId: 'invite-1' } });
            const res = createMockResponse();
            const invite = {
                _id: 'invite-1',
                status: 'pending',
                invitedUser: null,
                email: 'owner@example.com',
                save: vi.fn().mockResolvedValue(undefined),
            };

            mocks.Invite.findById.mockResolvedValue(invite);

            // Act
            await declineInvite(req, res);

            // Assert
            expect(invite.status).toBe('declined');
            expect(invite.save).toHaveBeenCalledTimes(1);
            expect(res.json).toHaveBeenCalledWith({ message: 'Invite declined' });
        });
    });

    describe('cancelInvite', () => {
        it('returns 403 when requester is not owner/admin', async () => {
            // Arrange
            const req = createMockRequest({ params: { inviteId: 'invite-1' } });
            const res = createMockResponse();

            mocks.Invite.findById.mockResolvedValue({
                _id: 'invite-1',
                workspace: 'workspace-1',
                deleteOne: vi.fn(),
            });
            mocks.Workspace.findById.mockResolvedValue({
                _id: 'workspace-1',
                members: [{ user: 'user-2', role: 'member' }],
            });

            // Act
            await cancelInvite(req, res);

            // Assert
            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Only owners and admins can cancel invites',
            });
        });

        it('cancels invite when requester is owner', async () => {
            // Arrange
            const req = createMockRequest({ params: { inviteId: 'invite-1' } });
            const res = createMockResponse();
            const invite = {
                _id: 'invite-1',
                workspace: 'workspace-1',
                deleteOne: vi.fn().mockResolvedValue(undefined),
            };

            mocks.Invite.findById.mockResolvedValue(invite);
            mocks.Workspace.findById.mockResolvedValue({
                _id: 'workspace-1',
                members: [{ user: 'user-1', role: 'owner' }],
            });

            // Act
            await cancelInvite(req, res);

            // Assert
            expect(invite.deleteOne).toHaveBeenCalledTimes(1);
            expect(res.json).toHaveBeenCalledWith({ message: 'Invite cancelled' });
        });
    });

    describe('verifyInviteToken', () => {
        it('returns 404 when invite token is invalid', async () => {
            // Arrange
            const req = createMockRequest({ params: { token: 'bad-token' } });
            const res = createMockResponse();
            const query = createTwoPopulateQuery(null);

            mocks.Invite.findOne.mockReturnValue(query.query);

            // Act
            await verifyInviteToken(req, res);

            // Assert
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: 'Invalid or expired invite' });
        });

        it('returns invite details when token is valid', async () => {
            // Arrange
            const req = createMockRequest({ params: { token: 'token-1' } });
            const res = createMockResponse();
            const invite = {
                email: 'external@example.com',
                role: 'member',
                expiresAt: new Date('2030-01-01T00:00:00.000Z'),
                workspace: { _id: 'workspace-1', name: 'Alpha' },
                invitedBy: { _id: 'user-2', fullname: 'Owner User' },
                isExpired: vi.fn().mockReturnValue(false),
            };
            const query = createTwoPopulateQuery(invite);

            mocks.Invite.findOne.mockReturnValue(query.query);

            // Act
            await verifyInviteToken(req, res);

            // Assert
            expect(query.firstPopulate).toHaveBeenCalledWith('workspace', 'name description');
            expect(query.secondPopulate).toHaveBeenCalledWith('invitedBy', 'fullname email');
            expect(res.json).toHaveBeenCalledWith({
                invite: {
                    email: 'external@example.com',
                    workspace: invite.workspace,
                    invitedBy: invite.invitedBy,
                    role: 'member',
                    expiresAt: invite.expiresAt,
                },
            });
        });
    });

    describe('acceptInviteByToken', () => {
        it('returns 403 when invite email does not match authenticated user', async () => {
            // Arrange
            const req = createMockRequest({ params: { token: 'token-1' } });
            const res = createMockResponse();

            mocks.Invite.findOne.mockResolvedValue({
                _id: 'invite-1',
                status: 'pending',
                email: 'other@example.com',
                isExpired: vi.fn().mockReturnValue(false),
            });

            // Act
            await acceptInviteByToken(req, res);

            // Assert
            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({ message: 'Email mismatch' });
        });

        it('accepts token invite and emits fetch_workspaces', async () => {
            // Arrange
            const io = createMockIo();
            const req = createMockRequest({
                params: { token: 'token-1' },
                user: {
                    _id: 'user-1',
                    email: 'owner@example.com',
                },
                app: { get: vi.fn().mockReturnValue(io) },
            });
            const res = createMockResponse();
            const invite = {
                _id: 'invite-1',
                status: 'pending',
                email: 'owner@example.com',
                role: 'member',
                workspace: 'workspace-1',
                isExpired: vi.fn().mockReturnValue(false),
                save: vi.fn().mockResolvedValue(undefined),
            };
            const workspace = {
                _id: 'workspace-1',
                members: [],
                save: vi.fn().mockResolvedValue(undefined),
                populate: vi.fn().mockResolvedValue(undefined),
            };

            mocks.Invite.findOne.mockResolvedValue(invite);
            mocks.Workspace.findById.mockResolvedValue(workspace);

            // Act
            await acceptInviteByToken(req, res);

            // Assert
            expect(workspace.members).toHaveLength(1);
            expect(workspace.members[0]).toEqual(
                expect.objectContaining({
                    user: 'user-1',
                    role: 'member',
                })
            );
            expect(invite.status).toBe('accepted');
            expect(invite.invitedUser).toBe('user-1');
            expect(io.to).toHaveBeenCalledWith('user_user-1');
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'Invite accepted successfully',
                    workspace,
                })
            );
        });
    });
});
