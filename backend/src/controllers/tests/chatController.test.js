import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
    Message: {
        find: vi.fn(),
        create: vi.fn(),
        findById: vi.fn(),
    },
    Workspace: {
        findById: vi.fn(),
    },
    Channel: {
        findById: vi.fn(),
    },
}));

vi.mock('../../models/Message.js', () => ({
    default: mocks.Message,
}));

vi.mock('../../models/Workspace.js', () => ({
    default: mocks.Workspace,
}));

vi.mock('../../models/Channel.js', () => ({
    default: mocks.Channel,
}));

import { deleteMessage, getMessages, sendMessage, votePoll } from '../chatController.js';

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
    },
    app: {
        get: vi.fn().mockReturnValue({
            to: vi.fn().mockReturnValue({ emit: vi.fn() }),
        }),
    },
    ...overrides,
});

const createMessageFindQuery = (result) => {
    const query = {
        populate: vi.fn(),
        sort: vi.fn(),
    };
    query.populate.mockReturnValue(query);
    query.sort.mockResolvedValue(result);
    return query;
};

describe('chatController', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('getMessages', () => {
        it('returns 404 when channel is not found', async () => {
            // Arrange
            const req = createMockRequest({ params: { channelId: 'channel-1' } });
            const res = createMockResponse();
            mocks.Channel.findById.mockResolvedValue(null);

            // Act
            await getMessages(req, res);

            // Assert
            expect(mocks.Channel.findById).toHaveBeenCalledWith('channel-1');
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: 'Channel not found' });
            expect(mocks.Message.find).not.toHaveBeenCalled();
        });

        it('returns 200 with populated and sorted messages', async () => {
            // Arrange
            const req = createMockRequest({ params: { channelId: 'channel-1' } });
            const res = createMockResponse();
            const messages = [{ _id: 'msg-1', content: 'hello' }];
            const query = createMessageFindQuery(messages);

            mocks.Channel.findById.mockResolvedValue({ type: 'channel', workspace: 'workspace-1' });
            mocks.Workspace.findById.mockResolvedValue({
                _id: 'workspace-1',
                members: [{ user: 'user-1' }],
            });
            mocks.Message.find.mockReturnValue(query);

            // Act
            await getMessages(req, res);

            // Assert
            expect(mocks.Message.find).toHaveBeenCalledWith({ channelId: 'channel-1' });
            expect(query.populate).toHaveBeenNthCalledWith(1, 'sender', 'fullname avatar email');
            expect(query.populate).toHaveBeenNthCalledWith(2, 'poll.options.votes', 'fullname avatar');
            expect(query.populate).toHaveBeenNthCalledWith(
                3,
                expect.objectContaining({
                    path: 'replyTo',
                    populate: expect.objectContaining({ path: 'sender', select: 'fullname avatar' }),
                })
            );
            expect(query.sort).toHaveBeenCalledWith({ createdAt: 1 });
            expect(res.json).toHaveBeenCalledWith(messages);
        });
    });

    describe('sendMessage', () => {
        it('returns 403 when user cannot access DM channel', async () => {
            // Arrange
            const req = createMockRequest({
                body: {
                    workspaceId: 'workspace-1',
                    channelId: 'channel-1',
                    content: 'hello',
                },
            });
            const res = createMockResponse();
            mocks.Channel.findById.mockResolvedValue({
                type: 'dm',
                members: ['user-2'],
            });

            // Act
            await sendMessage(req, res);

            // Assert
            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({ message: 'Not authorized' });
            expect(mocks.Message.create).not.toHaveBeenCalled();
        });

        it('creates message and returns 201 with populated sender and votes', async () => {
            // Arrange
            const req = createMockRequest({
                body: {
                    workspaceId: 'workspace-from-body',
                    channelId: 'channel-1',
                    content: 'hello world',
                },
            });
            const res = createMockResponse();
            const fullMessage = {
                _id: 'msg-1',
                content: 'hello world',
                populate: vi.fn().mockResolvedValue(undefined),
            };
            const newMessage = {
                populate: vi.fn().mockResolvedValue(fullMessage),
            };

            mocks.Channel.findById.mockResolvedValue({
                type: 'channel',
                workspace: { toString: () => 'workspace-real' },
            });
            mocks.Workspace.findById.mockResolvedValue({
                _id: 'workspace-real',
                members: [{ user: 'user-1' }],
            });
            mocks.Message.create.mockResolvedValue(newMessage);

            // Act
            await sendMessage(req, res);

            // Assert
            expect(mocks.Message.create).toHaveBeenCalledWith({
                workspaceId: 'workspace-real',
                channelId: 'channel-1',
                sender: 'user-1',
                content: 'hello world',
            });
            expect(newMessage.populate).toHaveBeenCalledWith('sender', 'fullname avatar');
            expect(fullMessage.populate).toHaveBeenCalledWith('poll.options.votes', 'fullname avatar');
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(fullMessage);
        });
    });

    describe('deleteMessage', () => {
        it('returns 404 when message is not found', async () => {
            // Arrange
            const req = createMockRequest({ params: { id: 'msg-1' } });
            const res = createMockResponse();
            mocks.Message.findById.mockResolvedValue(null);

            // Act
            await deleteMessage(req, res);

            // Assert
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: 'Message not found' });
        });

        it('returns 403 when user cannot delete message in channel', async () => {
            // Arrange
            const req = createMockRequest({ params: { id: 'msg-1' } });
            const res = createMockResponse();
            const message = {
                _id: 'msg-1',
                sender: 'user-2',
                channelId: 'channel-1',
                workspaceId: 'workspace-1',
                deleteOne: vi.fn(),
            };

            mocks.Message.findById.mockResolvedValue(message);
            mocks.Channel.findById.mockReturnValue({
                select: vi.fn().mockResolvedValue({ type: 'channel' }),
            });
            mocks.Workspace.findById.mockResolvedValue({
                _id: 'workspace-1',
                members: [{ user: 'user-1', role: 'member' }],
            });

            // Act
            await deleteMessage(req, res);

            // Assert
            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Not authorized to delete this message',
            });
            expect(message.deleteOne).not.toHaveBeenCalled();
        });

        it('returns 403 for DM when requester is not sender', async () => {
            // Arrange
            const req = createMockRequest({ params: { id: 'msg-1' } });
            const res = createMockResponse();
            const message = {
                _id: 'msg-1',
                sender: 'user-2',
                channelId: 'channel-dm',
                workspaceId: 'workspace-1',
                deleteOne: vi.fn(),
            };

            mocks.Message.findById.mockResolvedValue(message);
            mocks.Channel.findById.mockReturnValue({
                select: vi.fn().mockResolvedValue({ type: 'dm' }),
            });
            mocks.Workspace.findById.mockResolvedValue({
                _id: 'workspace-1',
                members: [{ user: 'user-1', role: 'member' }],
            });

            // Act
            await deleteMessage(req, res);

            // Assert
            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Not authorized to delete this message',
            });
            expect(message.deleteOne).not.toHaveBeenCalled();
        });

        it('deletes message successfully for admin user', async () => {
            // Arrange
            const req = createMockRequest({ params: { id: 'msg-1' } });
            const res = createMockResponse();
            const message = {
                _id: 'msg-1',
                sender: 'user-2',
                channelId: 'channel-1',
                workspaceId: 'workspace-1',
                deleteOne: vi.fn().mockResolvedValue(undefined),
            };

            mocks.Message.findById.mockResolvedValue(message);
            mocks.Channel.findById.mockReturnValue({
                select: vi.fn().mockResolvedValue({ type: 'channel' }),
            });
            mocks.Workspace.findById.mockResolvedValue({
                _id: 'workspace-1',
                members: [{ user: 'user-1', role: 'admin' }],
            });

            // Act
            await deleteMessage(req, res);

            // Assert
            expect(message.deleteOne).toHaveBeenCalledTimes(1);
            expect(res.json).toHaveBeenCalledWith({ message: 'Message deleted' });
        });
    });

    describe('votePoll', () => {
        it('returns 404 when poll is not found', async () => {
            // Arrange
            const req = createMockRequest({
                params: { id: 'msg-1' },
                body: { optionIndex: 0 },
            });
            const res = createMockResponse();
            mocks.Message.findById.mockResolvedValue(null);

            // Act
            await votePoll(req, res);

            // Assert
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: 'Poll not found' });
        });

        it('returns 400 for invalid poll option', async () => {
            // Arrange
            const req = createMockRequest({
                params: { id: 'msg-1' },
                body: { optionIndex: 5 },
            });
            const res = createMockResponse();
            const message = {
                _id: 'msg-1',
                channelId: 'channel-1',
                poll: {
                    options: [{ text: 'A', votes: [] }],
                    multipleAnswers: false,
                },
                save: vi.fn(),
            };

            mocks.Message.findById.mockResolvedValue(message);
            mocks.Channel.findById.mockResolvedValue({ type: 'channel', workspace: 'workspace-1' });
            mocks.Workspace.findById.mockResolvedValue({
                _id: 'workspace-1',
                members: [{ user: 'user-1', role: 'member' }],
            });

            // Act
            await votePoll(req, res);

            // Assert
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: 'Invalid option' });
            expect(message.save).not.toHaveBeenCalled();
        });

        it('adds vote and emits poll_updated successfully', async () => {
            // Arrange
            const pollUpdateEmit = vi.fn();
            const io = {
                to: vi.fn().mockReturnValue({ emit: pollUpdateEmit }),
            };
            const req = createMockRequest({
                params: { id: 'msg-1' },
                body: { optionIndex: 0 },
                app: { get: vi.fn().mockReturnValue(io) },
            });
            const res = createMockResponse();
            const message = {
                _id: 'msg-1',
                channelId: 'channel-1',
                poll: {
                    options: [
                        { text: 'Option A', votes: [] },
                        { text: 'Option B', votes: [] },
                    ],
                    multipleAnswers: false,
                },
                save: vi.fn().mockResolvedValue(undefined),
            };
            const fullMessage = {
                _id: 'msg-1',
                poll: { options: [] },
            };

            const secondPopulateVotes = vi.fn().mockResolvedValue(fullMessage);
            const secondPopulateSender = vi.fn().mockReturnValue({ populate: secondPopulateVotes });

            mocks.Message.findById
                .mockResolvedValueOnce(message)
                .mockReturnValueOnce({ populate: secondPopulateSender });
            mocks.Channel.findById.mockResolvedValue({ type: 'channel', workspace: 'workspace-1' });
            mocks.Workspace.findById.mockResolvedValue({
                _id: 'workspace-1',
                members: [{ user: 'user-1', role: 'member' }],
            });

            // Act
            await votePoll(req, res);

            // Assert
            expect(message.poll.options[0].votes).toContain('user-1');
            expect(message.save).toHaveBeenCalledTimes(1);
            expect(secondPopulateSender).toHaveBeenCalledWith('sender', 'fullname avatar');
            expect(secondPopulateVotes).toHaveBeenCalledWith('poll.options.votes', 'fullname avatar');
            expect(req.app.get).toHaveBeenCalledWith('io');
            expect(io.to).toHaveBeenCalledWith('channel-1');
            expect(pollUpdateEmit).toHaveBeenCalledWith('poll_updated', fullMessage);
            expect(res.json).toHaveBeenCalledWith(fullMessage);
        });
    });
});
