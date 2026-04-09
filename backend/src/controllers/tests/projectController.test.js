import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
    Project: {
        create: vi.fn(),
        find: vi.fn(),
        findById: vi.fn(),
    },
    Workspace: {
        findById: vi.fn(),
    },
    List: {
        insertMany: vi.fn(),
    },
    workspacePlanService: {
        canCreateProjectInWorkspace: vi.fn(),
    },
}));

vi.mock('../../models/Project.js', () => ({
    default: mocks.Project,
}));

vi.mock('../../models/Workspace.js', () => ({
    default: mocks.Workspace,
}));

vi.mock('../../models/List.js', () => ({
    default: mocks.List,
}));

vi.mock('../../services/workspacePlanService.js', () => ({
    canCreateProjectInWorkspace: mocks.workspacePlanService.canCreateProjectInWorkspace,
}));

import {
    createProject,
    deleteProject,
    getProjectsByWorkspace,
    updateProject,
} from '../projectController.js';

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
    app: { get: vi.fn() },
    ...overrides,
});

describe('projectController', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('createProject', () => {
        it('returns 404 when workspace is not found', async () => {
            // Arrange
            const req = createMockRequest({
                body: { workspaceId: 'workspace-1', name: 'Project A' },
            });
            const res = createMockResponse();
            mocks.Workspace.findById.mockResolvedValue(null);

            // Act
            await createProject(req, res);

            // Assert
            expect(mocks.Workspace.findById).toHaveBeenCalledWith('workspace-1');
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: 'Workspace not found' });
        });

        it('returns 403 when user is not a member of workspace', async () => {
            // Arrange
            const req = createMockRequest({
                body: { workspaceId: 'workspace-1', name: 'Project A' },
            });
            const res = createMockResponse();
            const workspace = {
                _id: 'workspace-1',
                members: [{ user: 'user-2' }],
            };
            mocks.Workspace.findById.mockResolvedValue(workspace);

            // Act
            await createProject(req, res);

            // Assert
            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({
                message: 'You are not a member of this workspace',
            });
            expect(mocks.workspacePlanService.canCreateProjectInWorkspace).not.toHaveBeenCalled();
        });

        it('returns 403 when project limit is reached', async () => {
            // Arrange
            const req = createMockRequest({
                body: { workspaceId: 'workspace-1', name: 'Project A' },
            });
            const res = createMockResponse();
            const workspace = {
                _id: 'workspace-1',
                members: [{ user: 'user-1' }],
            };
            mocks.Workspace.findById.mockResolvedValue(workspace);
            mocks.workspacePlanService.canCreateProjectInWorkspace.mockResolvedValue({
                allowed: false,
                limit: 5,
                projectCount: 5,
            });

            // Act
            await createProject(req, res);

            // Assert
            expect(mocks.workspacePlanService.canCreateProjectInWorkspace).toHaveBeenCalledWith(workspace);
            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    code: 'PROJECT_LIMIT_REACHED',
                    limit: 5,
                    currentCount: 5,
                })
            );
            expect(mocks.Project.create).not.toHaveBeenCalled();
        });

        it('creates project and default lists successfully', async () => {
            // Arrange
            const req = createMockRequest({
                body: {
                    workspaceId: 'workspace-1',
                    name: 'Project A',
                    description: 'Demo project',
                    tags: [' alpha ', '', 123],
                    members: [
                        { user: 'user-2', role: 'Manager' },
                        { user: 'user-3', role: 'InvalidRole' },
                        { user: 'user-9', role: 'Viewer' },
                    ],
                    priority: 'High',
                    projectColor: '#12ABef',
                    calendarEnabled: true,
                },
            });
            const res = createMockResponse();
            const workspace = {
                _id: 'workspace-1',
                members: [{ user: 'user-1' }, { user: 'user-2' }, { user: 'user-3' }],
            };
            const createdProject = {
                _id: 'project-1',
                name: 'Project A',
            };

            mocks.Workspace.findById.mockResolvedValue(workspace);
            mocks.workspacePlanService.canCreateProjectInWorkspace.mockResolvedValue({
                allowed: true,
                limit: 5,
                projectCount: 1,
            });
            mocks.Project.create.mockResolvedValue(createdProject);
            mocks.List.insertMany.mockResolvedValue([]);

            // Act
            await createProject(req, res);

            // Assert
            expect(mocks.Project.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    name: 'Project A',
                    description: 'Demo project',
                    workspace: 'workspace-1',
                    createdBy: 'user-1',
                    status: 'Planning',
                    priority: 'High',
                    projectColor: '#12ABef',
                    calendarEnabled: true,
                    tags: ['alpha'],
                    members: [
                        { user: 'user-2', role: 'Manager' },
                        { user: 'user-3', role: 'Contributor' },
                    ],
                })
            );
            expect(mocks.List.insertMany).toHaveBeenCalledWith([
                { title: 'To Do', order: 0, projectId: 'project-1' },
                { title: 'In Progress', order: 1, projectId: 'project-1' },
                { title: 'Done', order: 2, projectId: 'project-1' },
            ]);
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(createdProject);
        });
    });

    describe('getProjectsByWorkspace', () => {
        it('returns 400 when workspaceId is missing', async () => {
            // Arrange
            const req = createMockRequest({ query: {} });
            const res = createMockResponse();

            // Act
            await getProjectsByWorkspace(req, res);

            // Assert
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: 'workspaceId is required' });
            expect(mocks.Workspace.findById).not.toHaveBeenCalled();
        });

        it('returns 404 when workspace is not found', async () => {
            // Arrange
            const req = createMockRequest({ query: { workspaceId: 'workspace-1' } });
            const res = createMockResponse();
            mocks.Workspace.findById.mockResolvedValue(null);

            // Act
            await getProjectsByWorkspace(req, res);

            // Assert
            expect(mocks.Workspace.findById).toHaveBeenCalledWith('workspace-1');
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: 'Workspace not found' });
        });

        it('returns 403 when user is not a workspace member', async () => {
            // Arrange
            const req = createMockRequest({ query: { workspaceId: 'workspace-1' } });
            const res = createMockResponse();
            mocks.Workspace.findById.mockResolvedValue({
                _id: 'workspace-1',
                members: [{ user: 'user-2' }],
            });

            // Act
            await getProjectsByWorkspace(req, res);

            // Assert
            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Not authorized to view projects for this workspace',
            });
        });

        it('returns projects for authorized workspace member', async () => {
            // Arrange
            const req = createMockRequest({ query: { workspaceId: 'workspace-1' } });
            const res = createMockResponse();
            const projects = [{ _id: 'project-1' }, { _id: 'project-2' }];
            const populate = vi.fn().mockResolvedValue(projects);
            const sort = vi.fn().mockReturnValue({ populate });

            mocks.Workspace.findById.mockResolvedValue({
                _id: 'workspace-1',
                members: [{ user: 'user-1' }],
            });
            mocks.Project.find.mockReturnValue({ sort });

            // Act
            await getProjectsByWorkspace(req, res);

            // Assert
            expect(mocks.Project.find).toHaveBeenCalledWith({ workspace: 'workspace-1' });
            expect(sort).toHaveBeenCalledWith({ createdAt: -1 });
            expect(populate).toHaveBeenCalledWith('members.user', 'fullname email avatar');
            expect(res.json).toHaveBeenCalledWith(projects);
        });
    });

    describe('updateProject', () => {
        it('returns 404 when project does not exist', async () => {
            // Arrange
            const req = createMockRequest({ params: { id: 'project-1' } });
            const res = createMockResponse();
            mocks.Project.findById.mockResolvedValue(null);

            // Act
            await updateProject(req, res);

            // Assert
            expect(mocks.Project.findById).toHaveBeenCalledWith('project-1');
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: 'Project not found' });
        });

        it('returns 403 when requester is not owner/admin', async () => {
            // Arrange
            const req = createMockRequest({
                params: { id: 'project-1' },
                body: { name: 'Updated Project' },
            });
            const res = createMockResponse();
            const project = {
                _id: 'project-1',
                workspace: 'workspace-1',
            };

            mocks.Project.findById.mockResolvedValue(project);
            mocks.Workspace.findById.mockResolvedValue({
                _id: 'workspace-1',
                members: [{ user: 'user-1', role: 'member' }],
            });

            // Act
            await updateProject(req, res);

            // Assert
            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Only admins can edit project settings',
            });
        });

        it('updates project successfully for owner/admin', async () => {
            // Arrange
            const req = createMockRequest({
                params: { id: 'project-1' },
                body: {
                    name: 'Updated Project',
                    description: 'Updated desc',
                    status: 'In Progress',
                    tags: [' release ', '', 'v1'],
                    members: [
                        { user: 'user-2', role: 'Manager' },
                        { user: 'user-3', role: 'UnknownRole' },
                    ],
                    projectColor: '#ABCDEF',
                    calendarEnabled: true,
                    priority: 'High',
                },
            });
            const res = createMockResponse();
            const project = {
                _id: 'project-1',
                workspace: 'workspace-1',
                members: [{ user: 'user-9', role: 'Viewer' }],
                tags: ['old'],
                projectColor: '#111111',
                calendarEnabled: false,
                priority: 'Low',
                save: vi.fn().mockResolvedValue(undefined),
            };
            const updatedProject = { _id: 'project-1', name: 'Updated Project' };
            const populate = vi.fn().mockResolvedValue(updatedProject);

            mocks.Project.findById
                .mockResolvedValueOnce(project)
                .mockReturnValueOnce({ populate });
            mocks.Workspace.findById.mockResolvedValue({
                _id: 'workspace-1',
                members: [
                    { user: 'user-1', role: 'owner' },
                    { user: 'user-2', role: 'member' },
                    { user: 'user-3', role: 'member' },
                ],
            });

            // Act
            await updateProject(req, res);

            // Assert
            expect(project.name).toBe('Updated Project');
            expect(project.description).toBe('Updated desc');
            expect(project.status).toBe('In Progress');
            expect(project.priority).toBe('High');
            expect(project.projectColor).toBe('#ABCDEF');
            expect(project.calendarEnabled).toBe(true);
            expect(project.tags).toEqual(['release', 'v1']);
            expect(project.members).toEqual([
                { user: 'user-2', role: 'Manager' },
                { user: 'user-3', role: 'Contributor' },
            ]);
            expect(project.save).toHaveBeenCalledTimes(1);
            expect(populate).toHaveBeenCalledWith('members.user', 'fullname email avatar');
            expect(res.json).toHaveBeenCalledWith(updatedProject);
        });
    });

    describe('deleteProject', () => {
        it('returns 404 when project does not exist', async () => {
            // Arrange
            const req = createMockRequest({ params: { id: 'project-1' } });
            const res = createMockResponse();
            mocks.Project.findById.mockResolvedValue(null);

            // Act
            await deleteProject(req, res);

            // Assert
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: 'Project not found' });
        });

        it('returns 403 when requester is not owner/admin', async () => {
            // Arrange
            const req = createMockRequest({ params: { id: 'project-1' } });
            const res = createMockResponse();
            const project = {
                _id: 'project-1',
                workspace: 'workspace-1',
                deleteOne: vi.fn(),
            };

            mocks.Project.findById.mockResolvedValue(project);
            mocks.Workspace.findById.mockResolvedValue({
                _id: 'workspace-1',
                members: [{ user: 'user-1', role: 'member' }],
            });

            // Act
            await deleteProject(req, res);

            // Assert
            expect(project.deleteOne).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Not authorized to delete this project',
            });
        });

        it('deletes project successfully for owner/admin', async () => {
            // Arrange
            const req = createMockRequest({
                params: { id: 'project-1' },
            });
            const res = createMockResponse();
            const project = {
                _id: 'project-1',
                workspace: 'workspace-1',
                deleteOne: vi.fn().mockResolvedValue(undefined),
            };

            mocks.Project.findById.mockResolvedValue(project);
            mocks.Workspace.findById.mockResolvedValue({
                _id: 'workspace-1',
                members: [{ user: 'user-1', role: 'admin' }],
            });

            // Act
            await deleteProject(req, res);

            // Assert
            expect(project.deleteOne).toHaveBeenCalledTimes(1);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Project deleted successfully',
            });
        });
    });
});
