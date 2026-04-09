import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
    List: {
        find: vi.fn(),
        findOne: vi.fn(),
        findById: vi.fn(),
        create: vi.fn(),
    },
    Card: {
        find: vi.fn(),
        findOne: vi.fn(),
        findById: vi.fn(),
        create: vi.fn(),
    },
    Project: {
        findById: vi.fn(),
    },
    Workspace: {
        findById: vi.fn(),
    },
    boardService: {
        getProjectContext: vi.fn(),
        isAdminOrOwner: vi.fn(),
        canEditTask: vi.fn(),
        canDeleteComment: vi.fn(),
        sanitizeAssigneesForProject: vi.fn(),
        appendActivity: vi.fn(),
        emitWorkspaceEvent: vi.fn(),
        emitTaskChanged: vi.fn(),
        createAssigneeNotifications: vi.fn(),
        parseMentions: vi.fn(),
        createMentionNotifications: vi.fn(),
    },
    analyticsService: {
        calculateWorkspaceAnalytics: vi.fn(),
    },
    workspacePlanService: {
        canAccessWorkspaceAnalytics: vi.fn(),
    },
}));

vi.mock('../../models/List.js', () => ({
    default: mocks.List,
}));

vi.mock('../../models/Card.js', () => ({
    default: mocks.Card,
}));

vi.mock('../../models/Project.js', () => ({
    default: mocks.Project,
}));

vi.mock('../../models/Workspace.js', () => ({
    default: mocks.Workspace,
}));

vi.mock('../../services/boardService.js', () => ({
    getProjectContext: mocks.boardService.getProjectContext,
    isAdminOrOwner: mocks.boardService.isAdminOrOwner,
    canEditTask: mocks.boardService.canEditTask,
    canDeleteComment: mocks.boardService.canDeleteComment,
    sanitizeAssigneesForProject: mocks.boardService.sanitizeAssigneesForProject,
    appendActivity: mocks.boardService.appendActivity,
    emitWorkspaceEvent: mocks.boardService.emitWorkspaceEvent,
    emitTaskChanged: mocks.boardService.emitTaskChanged,
    createAssigneeNotifications: mocks.boardService.createAssigneeNotifications,
    parseMentions: mocks.boardService.parseMentions,
    createMentionNotifications: mocks.boardService.createMentionNotifications,
}));

vi.mock('../../services/analyticsService.js', () => ({
    calculateWorkspaceAnalytics: mocks.analyticsService.calculateWorkspaceAnalytics,
}));

vi.mock('../../services/workspacePlanService.js', () => ({
    canAccessWorkspaceAnalytics: mocks.workspacePlanService.canAccessWorkspaceAnalytics,
}));

import {
    createCard,
    createList,
    deleteCard,
    getBoard,
    updateCard,
} from '../boardController.js';

const createMockResponse = () => {
    const res = {};
    res.status = vi.fn().mockReturnValue(res);
    res.json = vi.fn().mockReturnValue(res);
    return res;
};

const createMockRequest = (overrides = {}) => ({
    params: {},
    body: {},
    query: {},
    user: {
        _id: 'user-1',
        fullname: 'Jane Doe',
        avatar: 'avatar.png',
    },
    app: {
        get: vi.fn().mockReturnValue({ to: vi.fn().mockReturnValue({ emit: vi.fn() }) }),
    },
    ...overrides,
});

const createProjectContext = (overrides = {}) => ({
    status: 200,
    project: {
        _id: 'project-1',
        members: [{ user: 'user-1' }, { user: 'user-2' }],
    },
    workspace: {
        _id: 'workspace-1',
    },
    member: {
        user: 'user-1',
        role: 'admin',
    },
    ...overrides,
});

describe('boardController', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('getBoard', () => {
        it('returns 200 with lists and cards', async () => {
            // Arrange
            const req = createMockRequest({ params: { projectId: 'project-1' } });
            const res = createMockResponse();
            const lists = [{ _id: 'list-1', title: 'To Do' }];
            const cards = [{ _id: 'card-1', title: 'Task A' }];

            const sortLists = vi.fn().mockResolvedValue(lists);
            mocks.List.find.mockReturnValue({ sort: sortLists });

            const populateComments = vi.fn().mockResolvedValue(cards);
            const populateAssignees = vi.fn().mockReturnValue({ populate: populateComments });
            const sortCards = vi.fn().mockReturnValue({ populate: populateAssignees });
            mocks.Card.find.mockReturnValue({ sort: sortCards });

            mocks.boardService.getProjectContext.mockResolvedValue(
                createProjectContext()
            );

            // Act
            await getBoard(req, res);

            // Assert
            expect(mocks.boardService.getProjectContext).toHaveBeenCalledWith('project-1', 'user-1');
            expect(mocks.List.find).toHaveBeenCalledWith({ projectId: 'project-1' });
            expect(sortLists).toHaveBeenCalledWith('order');
            expect(mocks.Card.find).toHaveBeenCalledWith({
                projectId: 'project-1',
                archived: { $ne: true },
            });
            expect(sortCards).toHaveBeenCalledWith('order');
            expect(populateAssignees).toHaveBeenCalledWith('assignees', 'fullname avatar');
            expect(populateComments).toHaveBeenCalledWith('comments.author', 'fullname avatar');
            expect(res.json).toHaveBeenCalledWith({ lists, cards });
        });

        it('returns context error when getProjectContext fails', async () => {
            // Arrange
            const req = createMockRequest({ params: { projectId: 'project-1' } });
            const res = createMockResponse();
            mocks.boardService.getProjectContext.mockResolvedValue({
                status: 403,
                message: 'Not authorized',
            });

            // Act
            await getBoard(req, res);

            // Assert
            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({ message: 'Not authorized' });
            expect(mocks.List.find).not.toHaveBeenCalled();
            expect(mocks.Card.find).not.toHaveBeenCalled();
        });
    });

    describe('createList', () => {
        it('returns 403 if user is not admin', async () => {
            // Arrange
            const req = createMockRequest({
                body: { title: 'In Progress', projectId: 'project-1' },
            });
            const res = createMockResponse();

            mocks.boardService.getProjectContext.mockResolvedValue(createProjectContext());
            mocks.boardService.isAdminOrOwner.mockReturnValue(false);

            // Act
            await createList(req, res);

            // Assert
            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({ message: 'Only admins can create lists' });
            expect(mocks.List.findOne).not.toHaveBeenCalled();
            expect(mocks.List.create).not.toHaveBeenCalled();
        });

        it('creates list with correct order and emits workspace event', async () => {
            // Arrange
            const req = createMockRequest({
                body: { title: 'Done', projectId: 'project-1' },
            });
            const res = createMockResponse();
            const context = createProjectContext();
            const createdList = { _id: 'list-9', title: 'Done', order: 3 };

            mocks.boardService.getProjectContext.mockResolvedValue(context);
            mocks.boardService.isAdminOrOwner.mockReturnValue(true);
            mocks.List.findOne.mockReturnValue({ sort: vi.fn().mockResolvedValue({ order: 2 }) });
            mocks.List.create.mockResolvedValue(createdList);

            // Act
            await createList(req, res);

            // Assert
            expect(mocks.List.findOne).toHaveBeenCalledWith({ projectId: 'project-1' });
            expect(mocks.List.create).toHaveBeenCalledWith({
                title: 'Done',
                projectId: 'project-1',
                order: 3,
            });
            expect(mocks.boardService.emitWorkspaceEvent).toHaveBeenCalledWith(
                req,
                'workspace-1',
                'list_created',
                { list: createdList }
            );
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(createdList);
        });
    });

    describe('createCard', () => {
        it('returns 400 if list does not belong to project', async () => {
            // Arrange
            const req = createMockRequest({
                body: {
                    title: 'Task A',
                    listId: 'list-1',
                    projectId: 'project-1',
                },
            });
            const res = createMockResponse();

            mocks.boardService.getProjectContext.mockResolvedValue(createProjectContext());
            mocks.List.findById.mockReturnValue({ select: vi.fn().mockResolvedValue(null) });

            // Act
            await createCard(req, res);

            // Assert
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: 'List does not belong to this project' });
            expect(mocks.Card.create).not.toHaveBeenCalled();
        });

        it('creates card with correct order, sanitizes assignees, and emits task_created', async () => {
            // Arrange
            const req = createMockRequest({
                body: {
                    title: 'Build auth tests',
                    listId: 'list-1',
                    projectId: 'project-1',
                    description: 'Write Vitest cases',
                    dueDate: '2026-05-10T00:00:00.000Z',
                    assignees: ['user-2', 'user-9'],
                    priority: 'High',
                },
            });
            const res = createMockResponse();
            const context = createProjectContext();
            const card = {
                _id: 'card-1',
                title: 'Build auth tests',
                projectId: 'project-1',
                listId: 'list-1',
                save: vi.fn().mockResolvedValue(undefined),
                populate: vi.fn().mockResolvedValue(undefined),
            };

            mocks.boardService.getProjectContext.mockResolvedValue(context);
            mocks.List.findById.mockReturnValue({
                select: vi.fn().mockResolvedValue({ projectId: 'project-1' }),
            });
            mocks.boardService.sanitizeAssigneesForProject.mockReturnValue(['user-2']);
            mocks.boardService.isAdminOrOwner.mockReturnValue(true);
            mocks.Card.findOne.mockReturnValue({ sort: vi.fn().mockResolvedValue({ order: 4 }) });
            mocks.Card.create.mockResolvedValue(card);

            // Act
            await createCard(req, res);

            // Assert
            expect(mocks.boardService.sanitizeAssigneesForProject).toHaveBeenCalledWith(
                ['user-2', 'user-9'],
                context.project
            );
            expect(mocks.Card.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    title: 'Build auth tests',
                    listId: 'list-1',
                    projectId: 'project-1',
                    order: 5,
                    description: 'Write Vitest cases',
                    assignees: ['user-2'],
                    priority: 'High',
                })
            );
            expect(mocks.boardService.appendActivity).toHaveBeenCalledWith(
                card,
                expect.objectContaining({
                    type: 'task_created',
                    actor: 'user-1',
                })
            );
            expect(card.save).toHaveBeenCalledTimes(1);
            expect(card.populate).toHaveBeenCalledWith('assignees', 'fullname avatar');
            expect(mocks.boardService.emitWorkspaceEvent).toHaveBeenCalledWith(
                req,
                'workspace-1',
                'task_created',
                { task: card }
            );
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(card);
        });
    });

    describe('updateCard', () => {
        it('returns 404 if card is not found', async () => {
            // Arrange
            const req = createMockRequest({ params: { id: 'card-404' } });
            const res = createMockResponse();
            mocks.Card.findById.mockResolvedValue(null);

            // Act
            await updateCard(req, res);

            // Assert
            expect(mocks.Card.findById).toHaveBeenCalledWith('card-404');
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: 'Card not found' });
        });

        it('returns 403 if user is not allowed to edit card', async () => {
            // Arrange
            const req = createMockRequest({ params: { id: 'card-1' } });
            const res = createMockResponse();
            const card = {
                _id: 'card-1',
                title: 'Old title',
                description: 'Old desc',
                dueDate: undefined,
                projectId: 'project-1',
                assignees: [],
            };

            mocks.Card.findById.mockResolvedValue(card);
            mocks.boardService.getProjectContext.mockResolvedValue(createProjectContext());
            mocks.boardService.canEditTask.mockReturnValue(false);

            // Act
            await updateCard(req, res);

            // Assert
            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({ message: 'Not authorized to edit this task' });
        });

        it('updates title, description, dueDate, appends activity, and emits task_updated', async () => {
            // Arrange
            const req = createMockRequest({
                params: { id: 'card-1' },
                body: {
                    title: '  New title  ',
                    description: 'New description',
                    dueDate: '2026-06-01T00:00:00.000Z',
                },
            });
            const res = createMockResponse();
            const context = createProjectContext();
            const card = {
                _id: 'card-1',
                title: 'Old title',
                description: 'Old description',
                dueDate: undefined,
                projectId: 'project-1',
                assignees: [],
                save: vi.fn().mockResolvedValue(undefined),
                populate: vi.fn().mockResolvedValue(undefined),
            };

            mocks.Card.findById.mockResolvedValue(card);
            mocks.boardService.getProjectContext.mockResolvedValue(context);
            mocks.boardService.canEditTask.mockReturnValue(true);

            // Act
            await updateCard(req, res);

            // Assert
            expect(card.title).toBe('New title');
            expect(card.description).toBe('New description');
            expect(card.dueDate).toBeInstanceOf(Date);
            expect(card.save).toHaveBeenCalledTimes(1);
            expect(card.populate).toHaveBeenNthCalledWith(1, 'assignees', 'fullname avatar');
            expect(card.populate).toHaveBeenNthCalledWith(2, 'comments.author', 'fullname avatar');

            const activityTypes = mocks.boardService.appendActivity.mock.calls.map((call) => call[1]?.type);
            expect(activityTypes).toContain('title_updated');
            expect(activityTypes).toContain('description_updated');
            expect(activityTypes).toContain('due_date_updated');

            expect(mocks.boardService.emitTaskChanged).toHaveBeenCalledWith(
                req,
                context,
                card,
                'task_updated'
            );
            expect(res.json).toHaveBeenCalledWith(card);
        });
    });

    describe('deleteCard', () => {
        it('returns 404 if card is not found', async () => {
            // Arrange
            const req = createMockRequest({ params: { id: 'card-404' } });
            const res = createMockResponse();
            mocks.Card.findById.mockResolvedValue(null);

            // Act
            await deleteCard(req, res);

            // Assert
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: 'Card not found' });
        });

        it('returns 403 if user is not admin/owner', async () => {
            // Arrange
            const req = createMockRequest({ params: { id: 'card-1' } });
            const res = createMockResponse();
            const card = {
                _id: 'card-1',
                projectId: 'project-1',
                listId: 'list-1',
                deleteOne: vi.fn(),
            };

            mocks.Card.findById.mockResolvedValue(card);
            mocks.boardService.getProjectContext.mockResolvedValue(createProjectContext());
            mocks.boardService.isAdminOrOwner.mockReturnValue(false);

            // Act
            await deleteCard(req, res);

            // Assert
            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({ message: 'Only admins can delete tasks' });
            expect(card.deleteOne).not.toHaveBeenCalled();
        });

        it('deletes card successfully and emits task_deleted', async () => {
            // Arrange
            const req = createMockRequest({ params: { id: 'card-1' } });
            const res = createMockResponse();
            const context = createProjectContext();
            const card = {
                _id: 'card-1',
                projectId: 'project-1',
                listId: 'list-1',
                deleteOne: vi.fn().mockResolvedValue(undefined),
            };

            mocks.Card.findById.mockResolvedValue(card);
            mocks.boardService.getProjectContext.mockResolvedValue(context);
            mocks.boardService.isAdminOrOwner.mockReturnValue(true);

            // Act
            await deleteCard(req, res);

            // Assert
            expect(card.deleteOne).toHaveBeenCalledTimes(1);
            expect(mocks.boardService.emitWorkspaceEvent).toHaveBeenCalledWith(
                req,
                'workspace-1',
                'task_deleted',
                {
                    task: {
                        _id: 'card-1',
                        projectId: 'project-1',
                        listId: 'list-1',
                    },
                }
            );
            expect(res.json).toHaveBeenCalledWith({ message: 'Card deleted' });
        });
    });
});
