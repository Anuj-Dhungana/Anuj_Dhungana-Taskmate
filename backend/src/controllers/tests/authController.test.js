import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
    User: {
        findOne: vi.fn(),
        findById: vi.fn(),
        create: vi.fn(),
        deleteOne: vi.fn(),
    },
    bcrypt: {
        compare: vi.fn(),
        genSalt: vi.fn(),
        hash: vi.fn(),
    },
    generateToken: vi.fn(),
    sendEmail: vi.fn(),
    otpService: {
        setVerifyOtp: vi.fn(),
        verifyAndConsumeVerifyOtp: vi.fn(),
        deleteVerifyOtp: vi.fn(),
        set2faOtp: vi.fn(),
        verifyAndConsume2faOtp: vi.fn(),
    },
    Workspace: {
        countDocuments: vi.fn(),
    },
    Project: {
        countDocuments: vi.fn(),
    },
    Card: {
        countDocuments: vi.fn(),
    },
}));

vi.mock('../../models/User.js', () => ({
    default: mocks.User,
}));

vi.mock('bcryptjs', () => ({
    default: mocks.bcrypt,
}));

vi.mock('../../utils/generateToken.js', () => ({
    default: mocks.generateToken,
}));

vi.mock('../../utils/sendEmail.js', () => ({
    default: mocks.sendEmail,
}));

vi.mock('../../services/otpRedisService.js', () => ({
    setVerifyOtp: mocks.otpService.setVerifyOtp,
    verifyAndConsumeVerifyOtp: mocks.otpService.verifyAndConsumeVerifyOtp,
    deleteVerifyOtp: mocks.otpService.deleteVerifyOtp,
    set2faOtp: mocks.otpService.set2faOtp,
    verifyAndConsume2faOtp: mocks.otpService.verifyAndConsume2faOtp,
}));

vi.mock('../../models/Workspace.js', () => ({
    default: mocks.Workspace,
}));

vi.mock('../../models/Project.js', () => ({
    default: mocks.Project,
}));

vi.mock('../../models/Card.js', () => ({
    default: mocks.Card,
}));

import { forgotPassword, loginUser, registerUser, verifyEmail } from '../authController.js';

const createMockResponse = () => {
    const res = {};
    res.status = vi.fn().mockReturnValue(res);
    res.json = vi.fn().mockReturnValue(res);
    res.cookie = vi.fn().mockReturnValue(res);
    return res;
};

describe('authController', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('registerUser', () => {
        it('returns 400 when user already exists', async () => {
            // Arrange
            const req = {
                body: {
                    fullname: 'Jane Doe',
                    email: 'user@example.com',
                    password: 'secret123',
                },
            };
            const res = createMockResponse();
            mocks.User.findOne.mockResolvedValue({ _id: 'existing-user' });

            // Act
            await registerUser(req, res);

            // Assert
            expect(mocks.User.findOne).toHaveBeenCalledWith({ email: 'user@example.com' });
            expect(mocks.User.create).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: 'User already exists' });
        });

        it('creates user, stores OTP, and sends verification email', async () => {
            // Arrange
            const req = {
                body: {
                    fullname: 'Jane Doe',
                    email: 'user@example.com',
                    password: 'secret123',
                },
            };
            const res = createMockResponse();
            const createdUser = {
                _id: 'user-1',
                email: 'user@example.com',
            };

            mocks.User.findOne.mockResolvedValue(null);
            mocks.bcrypt.genSalt.mockResolvedValue('salt-10');
            mocks.bcrypt.hash.mockResolvedValue('hashed-password');
            mocks.User.create.mockResolvedValue(createdUser);
            mocks.otpService.setVerifyOtp.mockResolvedValue(undefined);
            mocks.sendEmail.mockResolvedValue({ id: 'mail-1' });

            // Act
            await registerUser(req, res);

            // Assert
            expect(mocks.bcrypt.genSalt).toHaveBeenCalledWith(10);
            expect(mocks.bcrypt.hash).toHaveBeenCalledWith('secret123', 'salt-10');
            expect(mocks.User.create).toHaveBeenCalledWith({
                fullname: 'Jane Doe',
                email: 'user@example.com',
                password: 'hashed-password',
            });
            expect(mocks.otpService.setVerifyOtp).toHaveBeenCalledWith(
                'user@example.com',
                expect.stringMatching(/^\d{6}$/)
            );
            expect(mocks.sendEmail).toHaveBeenCalledWith(
                expect.objectContaining({
                    to: 'user@example.com',
                    subject: 'TaskMate - Verify your email',
                })
            );
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Registration successful! Please check your email for the code.',
                email: 'user@example.com',
            });
        });
    });

    describe('loginUser', () => {
        it('returns 401 when user is not found', async () => {
            // Arrange
            const req = { body: { email: 'missing@example.com', password: 'wrong-pass' } };
            const res = createMockResponse();
            mocks.User.findOne.mockResolvedValue(null);

            // Act
            await loginUser(req, res);

            // Assert
            expect(mocks.User.findOne).toHaveBeenCalledWith({ email: 'missing@example.com' });
            expect(mocks.bcrypt.compare).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ message: 'Invalid email or password' });
        });

        it('returns 401 when email is not verified', async () => {
            // Arrange
            const req = { body: { email: 'user@example.com', password: 'valid-pass' } };
            const res = createMockResponse();
            const user = {
                _id: 'user-1',
                fullname: 'Jane Doe',
                email: 'user@example.com',
                password: 'hashed-password',
                isVerified: false,
                twoFactorEnabled: false,
            };
            mocks.User.findOne.mockResolvedValue(user);
            mocks.bcrypt.compare.mockResolvedValue(true);

            // Act
            await loginUser(req, res);

            // Assert
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ message: 'Please verify your email first.' });
            expect(mocks.generateToken).not.toHaveBeenCalled();
        });

        it('returns user payload and sets token on successful login', async () => {
            // Arrange
            const req = { body: { email: 'user@example.com', password: 'valid-pass' } };
            const res = createMockResponse();
            const user = {
                _id: 'user-1',
                fullname: 'Jane Doe',
                email: 'user@example.com',
                password: 'hashed-password',
                isVerified: true,
                twoFactorEnabled: false,
            };
            mocks.User.findOne.mockResolvedValue(user);
            mocks.bcrypt.compare.mockResolvedValue(true);

            // Act
            await loginUser(req, res);

            // Assert
            expect(mocks.generateToken).toHaveBeenCalledWith(res, 'user-1');
            expect(res.json).toHaveBeenCalledWith({
                _id: 'user-1',
                fullname: 'Jane Doe',
                email: 'user@example.com',
                message: 'Logged in successfully!',
            });
        });

        it('returns 2fa_required when 2FA is enabled', async () => {
            // Arrange
            const req = { body: { email: 'user@example.com', password: 'valid-pass' } };
            const res = createMockResponse();
            const user = {
                _id: 'user-1',
                fullname: 'Jane Doe',
                email: 'user@example.com',
                password: 'hashed-password',
                isVerified: true,
                twoFactorEnabled: true,
            };

            mocks.User.findOne.mockResolvedValue(user);
            mocks.bcrypt.compare.mockResolvedValue(true);
            mocks.otpService.set2faOtp.mockResolvedValue(undefined);
            mocks.sendEmail.mockResolvedValue({ id: 'mail-2fa' });

            // Act
            await loginUser(req, res);

            // Assert
            expect(mocks.otpService.set2faOtp).toHaveBeenCalledWith(
                'user@example.com',
                expect.stringMatching(/^\d{6}$/)
            );
            expect(mocks.sendEmail).toHaveBeenCalledWith(
                expect.objectContaining({
                    to: 'user@example.com',
                    subject: 'TaskMate - 2FA Login Code',
                })
            );
            expect(mocks.generateToken).not.toHaveBeenCalled();
            expect(res.json).toHaveBeenCalledWith({
                status: '2fa_required',
                email: 'user@example.com',
                message: '2FA Code sent to your email',
            });
        });
    });

    describe('verifyEmail', () => {
        it('verifies email, saves user, and sets token for valid code', async () => {
            // Arrange
            const req = { body: { email: 'user@example.com', code: '123456' } };
            const res = createMockResponse();
            const user = {
                _id: 'user-1',
                fullname: 'Jane Doe',
                email: 'user@example.com',
                isVerified: false,
                save: vi.fn().mockResolvedValue(undefined),
            };
            mocks.User.findOne.mockResolvedValue(user);
            mocks.otpService.verifyAndConsumeVerifyOtp.mockResolvedValue(true);

            // Act
            await verifyEmail(req, res);

            // Assert
            expect(user.isVerified).toBe(true);
            expect(user.save).toHaveBeenCalledTimes(1);
            expect(mocks.generateToken).toHaveBeenCalledWith(res, 'user-1');
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                _id: 'user-1',
                fullname: 'Jane Doe',
                email: 'user@example.com',
                message: 'Email verified successfully!',
            });
        });

        it('returns 400 for invalid or expired verification code', async () => {
            // Arrange
            const req = { body: { email: 'user@example.com', code: '000000' } };
            const res = createMockResponse();
            const user = {
                _id: 'user-1',
                fullname: 'Jane Doe',
                email: 'user@example.com',
                save: vi.fn(),
            };
            mocks.User.findOne.mockResolvedValue(user);
            mocks.otpService.verifyAndConsumeVerifyOtp.mockResolvedValue(false);

            // Act
            await verifyEmail(req, res);

            // Assert
            expect(mocks.generateToken).not.toHaveBeenCalled();
            expect(user.save).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: 'Invalid or expired code' });
        });
    });

    describe('forgotPassword', () => {
        it('returns 404 when user is not found', async () => {
            // Arrange
            const req = { body: { email: 'missing@example.com' } };
            const res = createMockResponse();
            mocks.User.findOne.mockResolvedValue(null);

            // Act
            await forgotPassword(req, res);

            // Assert
            expect(mocks.User.findOne).toHaveBeenCalledWith({ email: 'missing@example.com' });
            expect(mocks.sendEmail).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: 'User not found' });
        });

        it('stores reset token and sends password reset email', async () => {
            // Arrange
            const req = { body: { email: 'user@example.com' } };
            const res = createMockResponse();
            const user = {
                email: 'user@example.com',
                resetPasswordToken: undefined,
                resetPasswordExpire: undefined,
                save: vi.fn().mockResolvedValue(undefined),
            };
            mocks.User.findOne.mockResolvedValue(user);
            mocks.sendEmail.mockResolvedValue({ id: 'mail-2' });

            // Act
            await forgotPassword(req, res);

            // Assert
            expect(user.resetPasswordToken).toEqual(expect.any(String));
            expect(user.resetPasswordToken).toHaveLength(64);
            expect(typeof user.resetPasswordExpire).toBe('number');
            expect(user.save).toHaveBeenCalledTimes(1);
            expect(mocks.sendEmail).toHaveBeenCalledWith(
                expect.objectContaining({
                    to: 'user@example.com',
                    subject: 'TaskMate Password Reset',
                    text: expect.stringContaining('/reset-password/'),
                })
            );
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ message: 'Email sent' });
        });

        it('clears reset token when email sending fails', async () => {
            // Arrange
            const req = { body: { email: 'user@example.com' } };
            const res = createMockResponse();
            const user = {
                email: 'user@example.com',
                resetPasswordToken: undefined,
                resetPasswordExpire: undefined,
                save: vi.fn().mockResolvedValue(undefined),
            };
            mocks.User.findOne.mockResolvedValue(user);
            mocks.sendEmail.mockRejectedValue(new Error('mail failed'));

            // Act
            await forgotPassword(req, res);

            // Assert
            expect(user.save).toHaveBeenCalledTimes(2);
            expect(user.resetPasswordToken).toBeUndefined();
            expect(user.resetPasswordExpire).toBeUndefined();
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ message: 'Email could not be sent' });
        });
    });
});
