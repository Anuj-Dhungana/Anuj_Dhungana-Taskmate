import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
    Workspace: {
        create: vi.fn(),
        find: vi.fn(),
        findById: vi.fn(),
    },
    Project: {
        find: vi.fn(),
    },
    Channel: {
        create: vi.fn(),
        find: vi.fn(),
    },
    User: {
        findOne: vi.fn(),
    },
    workspaceService: {
        findWorkspaceById: vi.fn(),
        findWorkspaceByIdWithMembers: vi.fn(),
        getWorkspaceMember: vi.fn(),
        isAdminOrOwner: vi.fn(),
        isWorkspaceMember: vi.fn(),
        removeNullMembers: vi.fn(),
        getMemberIndex: vi.fn(),
        validateInviteRole: vi.fn(),
    },
    workspacePlanService: {
        canAddMembersToWorkspace: vi.fn(),
    },
    realtimeService: {
        emitMemberAdded: vi.fn(),
        emitMemberRemoved: vi.fn(),
        emitRoleChanged: vi.fn(),
        emitWorkspaceUpdated: vi.fn(),
    },
}));

vi.mock('../../models/Workspace.js', () => ({
    default: mocks.Workspace,
}));

vi.mock('../../models/Project.js', () => ({
    default: mocks.Project,
}));

vi.mock('../../models/Channel.js', () => ({
    default: mocks.Channel,
}));

vi.mock('../../models/User.js', () => ({
    default: mocks.User,
}));

vi.mock('../../services/workspaceService.js', () => ({
    findWorkspaceById: mocks.workspaceService.findWorkspaceById,
    findWorkspaceByIdWithMembers: mocks.workspaceService.findWorkspaceByIdWithMembers,
    getWorkspaceMember: mocks.workspaceService.getWorkspaceMember,
    isAdminOrOwner: mocks.workspaceService.isAdminOrOwner,
    isWorkspaceMember: mocks.workspaceService.isWorkspaceMember,
    removeNullMembers: mocks.workspaceService.removeNullMembers,
    getMemberIndex: mocks.workspaceService.getMemberIndex,
    validateInviteRole: mocks.workspaceService.validateInviteRole,
}));

vi.mock('../../services/workspacePlanService.js', () => ({
    canAddMembersToWorkspace: mocks.workspacePlanService.canAddMembersToWorkspace,
}));

vi.mock('../../services/realtimeService.js', () => ({
    emitMemberAdded: mocks.realtimeService.emitMemberAdded,
    emitMemberRemoved: mocks.realtimeService.emitMemberRemoved,
    emitRoleChanged: mocks.realtimeService.emitRoleChanged,
    emitWorkspaceUpdated: mocks.realtimeService.emitWorkspaceUpdated,
}));

import {
    createWorkspace,
    deleteWorkspace,
    getMyWorkspaces,
    getWorkspaceDetails,
    inviteUserToWorkspace,
    removeMember,
    transferWorkspaceOwnership,
    updateMemberRole,
    updateWorkspace,
} from '../workspaceController.js';

const createMockResponse = () => {
    const res = {};
    res.status = vi.fn().mockReturnValue(res);
    res.json = vi.fn().mockReturnValue(res);
    return res;
};

const createMockRequest = (overrides = {}) => ({
    body: {},
    query: {},
    params: {},
    user: { _id: 'user-1' },
    workspace: undefined,
    app: {
        get: vi.fn().mockReturnValue({
            to: vi.fn().mockReturnValue({ emit: vi.fn() }),
        }),
    },
    ...overrides,
});

describe('workspaceController', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('createWorkspace', () => {
        it('creates workspace and default general channel', async () => {
            // Arrange
            const req = createMockRequest({
                body: {
                    name: 'Alpha',
                    description: 'Main workspace',
                    color: '  #FF9900  ',
                },
            });
            const res = createMockResponse();
            const workspace = { _id: 'workspace-1', name: 'Alpha' };

            mocks.Workspace.create.mockResolvedValue(workspace);
            mocks.Channel.create.mockResolvedValue({ _id: 'channel-1' });

            // Act
            await createWorkspace(req, res);

            // Assert
            expect(mocks.Workspace.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    name: 'Alpha',
                    description: 'Main workspace',
                    color: '  #FF9900  ',
                    members: [{ user: 'user-1', role: 'owner' }],
                })
            );
            expect(mocks.Channel.create).toHaveBeenCalledWith({
                name: 'general',
                workspace: 'workspace-1',
                type: 'channel',
                isGeneral: true,
            });
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(workspace);
        });

        it('returns 500 on create workspace failure', async () => {
            // Arrange
            const req = createMockRequest({ body: { name: 'Alpha' } });
            const res = createMockResponse();
            mocks.Workspace.create.mockRejectedValue(new Error('db fail'));

            // Act
            await createWorkspace(req, res);

            // Assert
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ message: 'Server Error' });
        });
    });

    describe('getMyWorkspaces', () => {
        it('returns user workspaces sorted by createdAt desc', async () => {
            // Arrange
            const req = createMockRequest();
            const res = createMockResponse();
            const workspaces = [{ _id: 'workspace-1' }, { _id: 'workspace-2' }];
            const sort = vi.fn().mockResolvedValue(workspaces);
            mocks.Workspace.find.mockReturnValue({ sort });

            // Act
            await getMyWorkspaces(req, res);

            // Assert
            expect(mocks.Workspace.find).toHaveBeenCalledWith({ 'members.user': 'user-1' });
            expect(sort).toHaveBeenCalledWith({ createdAt: -1 });
            expect(res.json).toHaveBeenCalledWith(workspaces);
        });
    });

    describe('getWorkspaceDetails', () => {
        it('returns 404 when workspace does not exist', async () => {
            // Arrange
            const req = createMockRequest({ params: { id: 'workspace-1' } });
            const res = createMockResponse();
            mocks.workspaceService.findWorkspaceByIdWithMembers.mockResolvedValue(null);

            // Act
            await getWorkspaceDetails(req, res);

            // Assert
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: 'Workspace not found' });
        });

        it('returns 403 when user is not a member', async () => {
            // Arrange
            const req = createMockRequest({ params: { id: 'workspace-1' } });
            const res = createMockResponse();
            const workspace = { _id: 'workspace-1', members: [], save: vi.fn() };

            mocks.workspaceService.findWorkspaceByIdWithMembers.mockResolvedValue(workspace);
            mocks.workspaceService.removeNullMembers.mockReturnValue({ changed: false, members: [] });
            mocks.workspaceService.isWorkspaceMember.mockReturnValue(false);

            // Act
            await getWorkspaceDetails(req, res);

            // Assert
            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Not authorized to view this workspace',
            });
            expect(mocks.Project.find).not.toHaveBeenCalled();
        });

        it('returns workspace details and saves cleaned members when needed', async () => {
            // Arrange
            const req = createMockRequest({ params: { id: 'workspace-1' } });
            const res = createMockResponse();
            const workspace = {
                _id: 'workspace-1',
                members: [{ user: 'user-1' }, { user: null }],
                save: vi.fn().mockResolvedValue(undefined),
            };
            const projects = [{ _id: 'project-1' }];
            const channels = [{ _id: 'channel-1' }];

            mocks.workspaceService.findWorkspaceByIdWithMembers.mockResolvedValue(workspace);
            mocks.workspaceService.removeNullMembers.mockReturnValue({
                changed: true,
                members: [{ user: 'user-1' }],
            });
            mocks.workspaceService.isWorkspaceMember.mockReturnValue(true);
            mocks.Project.find.mockReturnValue({ sort: vi.fn().mockResolvedValue(projects) });
            mocks.Channel.find.mockReturnValue({ sort: vi.fn().mockResolvedValue(channels) });

            // Act
            await getWorkspaceDetails(req, res);

            // Assert
            expect(workspace.members).toEqual([{ user: 'user-1' }]);
            expect(workspace.save).toHaveBeenCalledTimes(1);
            expect(mocks.Project.find).toHaveBeenCalledWith({ workspace: 'workspace-1' });
            expect(mocks.Channel.find).toHaveBeenCalledWith({
                workspace: 'workspace-1',
                type: { $in: ['channel', null] },
            });
            expect(res.json).toHaveBeenCalledWith({ workspace, projects, channels });
        });
    });

    describe('inviteUserToWorkspace', () => {
        it('returns 404 when workspace does not exist', async () => {
            // Arrange
            const req = createMockRequest({
                params: { id: 'workspace-1' },
                body: { email: 'member@example.com' },
            });
            const res = createMockResponse();
            mocks.workspaceService.findWorkspaceById.mockResolvedValue(null);

            // Act
            await inviteUserToWorkspace(req, res);

            // Assert
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: 'Workspace not found' });
        });

        it('returns 403 when requester is not admin/owner', async () => {
            // Arrange
            const req = createMockRequest({
                params: { id: 'workspace-1' },
                body: { email: 'member@example.com' },
            });
            const res = createMockResponse();
            const workspace = { _id: 'workspace-1', members: [] };

            mocks.workspaceService.findWorkspaceById.mockResolvedValue(workspace);
            mocks.workspaceService.getWorkspaceMember.mockReturnValue({ user: 'user-1', role: 'member' });
            mocks.workspaceService.isAdminOrOwner.mockReturnValue(false);

            // Act
            await inviteUserToWorkspace(req, res);

            // Assert
            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({ message: 'Only Admins can invite users' });
        });

        it('returns 403 when member limit is reached', async () => {
            // Arrange
            const req = createMockRequest({
                params: { id: 'workspace-1' },
                body: { email: 'member@example.com' },
            });
            const res = createMockResponse();
            const workspace = { _id: 'workspace-1', members: [{ user: 'user-1' }], save: vi.fn() };
            const userToInvite = { _id: 'user-2', fullname: 'John Doe' };

            mocks.workspaceService.findWorkspaceById.mockResolvedValue(workspace);
            mocks.workspaceService.getWorkspaceMember.mockReturnValue({ user: 'user-1', role: 'owner' });
            mocks.workspaceService.isAdminOrOwner.mockReturnValue(true);
            mocks.User.findOne.mockResolvedValue(userToInvite);
            mocks.workspaceService.isWorkspaceMember.mockReturnValue(false);
            mocks.workspacePlanService.canAddMembersToWorkspace.mockReturnValue({
                allowed: false,
                limit: 5,
                currentMembers: 5,
            });

            // Act
            await inviteUserToWorkspace(req, res);

            // Assert
            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    code: 'MEMBER_LIMIT_REACHED',
                    limit: 5,
                    currentCount: 5,
                })
            );
            expect(workspace.save).not.toHaveBeenCalled();
        });

        it('adds member and emits member added event successfully', async () => {
            // Arrange
            const req = createMockRequest({
                params: { id: 'workspace-1' },
                body: { email: 'member@example.com' },
            });
            const res = createMockResponse();
            const workspace = {
                _id: 'workspace-1',
                members: [{ user: 'user-1', role: 'owner' }],
                save: vi.fn().mockResolvedValue(undefined),
            };
            const userToInvite = { _id: 'user-2', fullname: 'John Doe' };

            mocks.workspaceService.findWorkspaceById.mockResolvedValue(workspace);
            mocks.workspaceService.getWorkspaceMember.mockReturnValue({ user: 'user-1', role: 'owner' });
            mocks.workspaceService.isAdminOrOwner.mockReturnValue(true);
            mocks.User.findOne.mockResolvedValue(userToInvite);
            mocks.workspaceService.isWorkspaceMember.mockReturnValue(false);
            mocks.workspacePlanService.canAddMembersToWorkspace.mockReturnValue({ allowed: true });

            // Act
            await inviteUserToWorkspace(req, res);

            // Assert
            expect(workspace.members).toContainEqual({ user: 'user-2', role: 'member' });
            expect(workspace.save).toHaveBeenCalledTimes(1);
            expect(mocks.realtimeService.emitMemberAdded).toHaveBeenCalledWith(
                req,
                'workspace-1',
                'user-2',
                'member'
            );
            expect(res.json).toHaveBeenCalledWith({ message: 'John Doe added to workspace!' });
        });
    });

    describe('updateMemberRole', () => {
        it('returns 403 when requester is not in workspace', async () => {
            // Arrange
            const req = createMockRequest({
                body: { memberId: 'user-2', newRole: 'admin' },
                workspace: { _id: 'workspace-1', members: [] },
            });
            const res = createMockResponse();
            mocks.workspaceService.getWorkspaceMember.mockReturnValue(null);

            // Act
            await updateMemberRole(req, res);

            // Assert
            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({ message: 'Not authorized' });
        });

        it('returns 400 when role is invalid', async () => {
            // Arrange
            const req = createMockRequest({
                body: { memberId: 'user-2', newRole: 'viewer' },
                workspace: { _id: 'workspace-1', members: [] },
            });
            const res = createMockResponse();
            mocks.workspaceService.getWorkspaceMember.mockReturnValue({ user: 'user-1', role: 'owner' });

            // Act
            await updateMemberRole(req, res);

            // Assert
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: 'Invalid role' });
        });

        it('returns 403 when requester is admin (only owner can change role)', async () => {
            // Arrange
            const req = createMockRequest({
                body: { memberId: 'user-2', newRole: 'admin' },
                workspace: {
                    _id: 'workspace-1',
                    members: [
                        { user: 'user-1', role: 'admin' },
                        { user: 'user-2', role: 'member' },
                    ],
                    save: vi.fn(),
                },
            });
            const res = createMockResponse();
            mocks.workspaceService.getWorkspaceMember.mockReturnValue({ user: 'user-1', role: 'admin' });
            mocks.workspaceService.getMemberIndex.mockReturnValue(1);

            // Act
            await updateMemberRole(req, res);

            // Assert
            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({ message: 'Only owners can change member roles' });
        });

        it('updates role successfully for owner requester', async () => {
            // Arrange
            const workspace = {
                _id: 'workspace-1',
                members: [
                    { user: 'user-1', role: 'owner' },
                    { user: 'user-2', role: 'member' },
                ],
                save: vi.fn().mockResolvedValue(undefined),
            };
            const req = createMockRequest({
                body: { memberId: 'user-2', newRole: 'admin' },
                workspace,
            });
            const res = createMockResponse();

            mocks.workspaceService.getWorkspaceMember.mockReturnValue({ user: 'user-1', role: 'owner' });
            mocks.workspaceService.getMemberIndex.mockReturnValue(1);

            // Act
            await updateMemberRole(req, res);

            // Assert
            expect(workspace.members[1].role).toBe('admin');
            expect(workspace.save).toHaveBeenCalledTimes(1);
            expect(mocks.realtimeService.emitRoleChanged).toHaveBeenCalledWith(
                req,
                'workspace-1',
                'user-2',
                'admin'
            );
            expect(res.json).toHaveBeenCalledWith({ message: 'Role updated successfully' });
        });
    });

    describe('removeMember', () => {
        it('returns 400 when trying to remove workspace owner', async () => {
            // Arrange
            const workspace = {
                _id: 'workspace-1',
                members: [
                    { user: 'user-1', role: 'owner' },
                    { user: 'user-2', role: 'member' },
                ],
                save: vi.fn(),
            };
            const req = createMockRequest({
                params: { memberId: 'user-1' },
                workspace,
            });
            const res = createMockResponse();

            mocks.workspaceService.getWorkspaceMember
                .mockReturnValueOnce({ user: 'user-1', role: 'owner' })
                .mockReturnValueOnce({ user: 'user-1', role: 'owner' });

            // Act
            await removeMember(req, res);

            // Assert
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: 'Cannot remove the Workspace Owner' });
            expect(workspace.save).not.toHaveBeenCalled();
        });

        it('returns 403 when admin tries to remove non-member role', async () => {
            // Arrange
            const workspace = {
                _id: 'workspace-1',
                members: [
                    { user: 'user-1', role: 'admin' },
                    { user: 'user-2', role: 'admin' },
                ],
                save: vi.fn(),
            };
            const req = createMockRequest({
                params: { memberId: 'user-2' },
                workspace,
            });
            const res = createMockResponse();

            mocks.workspaceService.getWorkspaceMember
                .mockReturnValueOnce({ user: 'user-1', role: 'admin' })
                .mockReturnValueOnce({ user: 'user-2', role: 'admin' });

            // Act
            await removeMember(req, res);

            // Assert
            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({ message: 'Admins can only remove members' });
        });

        it('removes member, emits events, and requests sidebar refresh', async () => {
            // Arrange
            const io = { to: vi.fn().mockReturnValue({ emit: vi.fn() }) };
            const workspace = {
                _id: 'workspace-1',
                members: [
                    { user: 'user-1', role: 'owner' },
                    { user: 'user-2', role: 'member' },
                ],
                save: vi.fn().mockResolvedValue(undefined),
            };
            const req = createMockRequest({
                params: { memberId: 'user-2' },
                workspace,
                app: { get: vi.fn().mockReturnValue(io) },
            });
            const res = createMockResponse();

            mocks.workspaceService.getWorkspaceMember
                .mockReturnValueOnce({ user: 'user-1', role: 'owner' })
                .mockReturnValueOnce({ user: 'user-2', role: 'member' });

            // Act
            await removeMember(req, res);

            // Assert
            expect(workspace.members).toEqual([{ user: 'user-1', role: 'owner' }]);
            expect(workspace.save).toHaveBeenCalledTimes(1);
            expect(mocks.realtimeService.emitMemberRemoved).toHaveBeenCalledWith(
                req,
                'workspace-1',
                'user-2'
            );
            expect(req.app.get).toHaveBeenCalledWith('io');
            expect(io.to).toHaveBeenCalledWith('user_user-2');
            expect(res.json).toHaveBeenCalledWith({ message: 'Member removed from workspace' });
        });
    });

    describe('updateWorkspace', () => {
        it('returns 404 when req.workspace is missing', async () => {
            // Arrange
            const req = createMockRequest({ workspace: null });
            const res = createMockResponse();

            // Act
            await updateWorkspace(req, res);

            // Assert
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: 'Workspace not found' });
        });

        it('returns 400 when default invite role is invalid', async () => {
            // Arrange
            const workspace = {
                _id: 'workspace-1',
                settings: {},
                save: vi.fn(),
            };
            const req = createMockRequest({
                workspace,
                body: {
                    settings: {
                        access: {
                            defaultInviteRole: 'viewer',
                        },
                    },
                },
            });
            const res = createMockResponse();
            mocks.workspaceService.validateInviteRole.mockReturnValue(false);

            // Act
            await updateWorkspace(req, res);

            // Assert
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: 'Invalid default invite role' });
            expect(workspace.save).not.toHaveBeenCalled();
        });

        it('updates workspace and emits workspace_updated', async () => {
            // Arrange
            const workspace = {
                _id: 'workspace-1',
                name: 'Old',
                description: 'Old desc',
                color: '#000000',
                settings: {},
                save: vi.fn().mockResolvedValue({ _id: 'workspace-1' }),
            };
            const updatedWorkspace = { _id: 'workspace-1', name: 'New' };
            const req = createMockRequest({
                workspace,
                body: {
                    name: 'New',
                    description: 'New desc',
                    color: '#FF00AA',
                    settings: {
                        access: {
                            defaultInviteRole: 'member',
                            requireInviteAcceptance: false,
                            membersCanViewMemberList: false,
                        },
                    },
                },
            });
            const res = createMockResponse();

            mocks.workspaceService.validateInviteRole.mockReturnValue(true);
            mocks.Workspace.findById.mockReturnValue({
                populate: vi.fn().mockResolvedValue(updatedWorkspace),
            });

            // Act
            await updateWorkspace(req, res);

            // Assert
            expect(workspace.name).toBe('New');
            expect(workspace.description).toBe('New desc');
            expect(workspace.color).toBe('#FF00AA');
            expect(workspace.settings.access.defaultInviteRole).toBe('member');
            expect(workspace.settings.access.requireInviteAcceptance).toBe(false);
            expect(workspace.settings.access.membersCanViewMemberList).toBe(false);
            expect(workspace.save).toHaveBeenCalledTimes(1);
            expect(mocks.realtimeService.emitWorkspaceUpdated).toHaveBeenCalledWith(
                req,
                'workspace-1',
                updatedWorkspace
            );
            expect(res.json).toHaveBeenCalledWith(updatedWorkspace);
        });
    });

    describe('transferWorkspaceOwnership', () => {
        it('returns 400 when newOwnerId is missing', async () => {
            // Arrange
            const req = createMockRequest({
                workspace: {
                    _id: 'workspace-1',
                    members: [{ user: 'user-1', role: 'owner' }],
                },
                body: {},
            });
            const res = createMockResponse();

            // Act
            await transferWorkspaceOwnership(req, res);

            // Assert
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: 'newOwnerId is required' });
        });

        it('returns 403 when requester is not current owner', async () => {
            // Arrange
            const req = createMockRequest({
                workspace: {
                    _id: 'workspace-1',
                    members: [{ user: 'user-1', role: 'admin' }, { user: 'user-2', role: 'member' }],
                },
                body: { newOwnerId: 'user-2' },
            });
            const res = createMockResponse();

            // Act
            await transferWorkspaceOwnership(req, res);

            // Assert
            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Only the current owner can transfer ownership',
            });
        });

        it('transfers ownership successfully and emits role/workspace events', async () => {
            // Arrange
            const workspace = {
                _id: 'workspace-1',
                members: [
                    { user: 'user-1', role: 'owner' },
                    { user: 'user-2', role: 'member' },
                ],
                save: vi.fn().mockResolvedValue(undefined),
            };
            const updatedWorkspace = { _id: 'workspace-1', members: [] };
            const req = createMockRequest({
                workspace,
                body: { newOwnerId: 'user-2' },
            });
            const res = createMockResponse();

            mocks.workspaceService.getMemberIndex.mockReturnValue(1);
            mocks.Workspace.findById.mockReturnValue({
                populate: vi.fn().mockResolvedValue(updatedWorkspace),
            });

            // Act
            await transferWorkspaceOwnership(req, res);

            // Assert
            expect(workspace.members[0].role).toBe('admin');
            expect(workspace.members[1].role).toBe('owner');
            expect(workspace.save).toHaveBeenCalledTimes(1);
            expect(mocks.realtimeService.emitRoleChanged).toHaveBeenNthCalledWith(
                1,
                req,
                'workspace-1',
                'user-1',
                'admin'
            );
            expect(mocks.realtimeService.emitRoleChanged).toHaveBeenNthCalledWith(
                2,
                req,
                'workspace-1',
                'user-2',
                'owner'
            );
            expect(mocks.realtimeService.emitWorkspaceUpdated).toHaveBeenCalledWith(
                req,
                'workspace-1',
                updatedWorkspace
            );
            expect(res.json).toHaveBeenCalledWith({
                message: 'Ownership transferred successfully',
                workspace: updatedWorkspace,
            });
        });
    });

    describe('deleteWorkspace', () => {
        it('deletes workspace and returns success message', async () => {
            // Arrange
            const req = createMockRequest({
                workspace: {
                    deleteOne: vi.fn().mockResolvedValue(undefined),
                },
                params: { id: 'workspace-1' },
            });
            const res = createMockResponse();

            // Act
            await deleteWorkspace(req, res);

            // Assert
            expect(req.workspace.deleteOne).toHaveBeenCalledTimes(1);
            expect(res.json).toHaveBeenCalledWith({ message: 'Workspace deleted successfully' });
        });
    });
});
