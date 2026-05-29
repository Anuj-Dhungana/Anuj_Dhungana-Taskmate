import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import User from '../models/User.js';
import Workspace from '../models/Workspace.js';
import Project from '../models/Project.js';
import Card from '../models/Card.js';
import sendEmail from '../utils/sendEmail.js';
import generateToken from '../utils/generateToken.js';
import {
    setVerifyOtp,
    verifyAndConsumeVerifyOtp,
    deleteVerifyOtp,
    set2faOtp,
    verifyAndConsume2faOtp,
} from './otpRedisService.js';

const SALT_ROUNDS = 10;

const getFrontendBaseUrl = () =>
    String(process.env.FRONTEND_URL || 'http://localhost:5173')
        .trim()
        .replace(/\/+$/, '');

/**
 * Generate a 6-digit numeric OTP string.
 */
export const generateOtp = () =>
    Math.floor(100000 + Math.random() * 900000).toString();

/**
 * Hash a plain-text password with bcrypt.
 */
export const hashPassword = async (plain) => {
    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    return bcrypt.hash(plain, salt);
};

/**
 * Compare a plain-text password against a bcrypt hash.
 */
export const comparePassword = (plain, hash) => bcrypt.compare(plain, hash);

/**
 * Generate a password-reset token, store its hash + expiry on the user
 * document, and return the raw token (for the reset URL).
 * NOTE: caller must call user.save() after this.
 */
export const applyResetToken = (user) => {
    const rawToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = crypto
        .createHash('sha256')
        .update(rawToken)
        .digest('hex');
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 min
    return rawToken;
};

/**
 * Clear reset-token fields on a user document.
 * NOTE: caller must call user.save() after this.
 */
export const clearResetToken = (user) => {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
};

/**
 * Build a standardised public user response object.
 */
export const buildUserResponse = (user) => ({
    _id: user._id,
    fullname: user.fullname,
    email: user.email,
    avatar: user.avatar,
    isVerified: user.isVerified,
    twoFactorEnabled: user.twoFactorEnabled,
});


// Registration flow

/**
 * Register a new user:
 *  1. Check for duplicate email
 *  2. Hash password
 *  3. Create user (unverified)
 *  4. Store OTP in Redis
 *  5. Send verification email
 *
 * Returns { email } on success; throws on failure.
 * On any failure after creating the user the user record is rolled back.
 */
export const registerUser = async ({ fullname, email, password }) => {
    const userExists = await User.findOne({ email });
    if (userExists) {
        const err = new Error('User already exists');
        err.status = 400;
        throw err;
    }

    const hashedPassword = await hashPassword(password);
    const code = generateOtp();

    const user = await User.create({ fullname, email, password: hashedPassword });

    // Store OTP — roll back if Redis fails
    try {
        await setVerifyOtp(email, code);
    } catch (redisErr) {
        await User.deleteOne({ _id: user._id });
        console.error('Redis (verify OTP):', redisErr);
        const err = new Error('Could not store verification code. Try again.');
        err.status = 500;
        throw err;
    }

    // Send email — roll back if email fails
    try {
        await sendEmail({
            to: user.email,
            subject: 'TaskMate - Verify your email',
            text: `<h1>Welcome to TaskMate!</h1>
                   <p>Your verification code is:</p>
                   <h2 style="color:blue;">${code}</h2>
                   <p>This code expires in 10 minutes.</p>`,
        });
    } catch {
        await deleteVerifyOtp(email);
        await User.deleteOne({ _id: user._id });
        const err = new Error('Email could not be sent. Please try again.');
        err.status = 500;
        throw err;
    }

    return { email: user.email };
};


// Email verification flow


/**
 * Verify the OTP for an email address.
 * On success marks the user verified and returns the user doc.
 * Throws on invalid/expired code or missing user.
 */
export const verifyUserEmail = async ({ email, code }) => {
    const user = await User.findOne({ email });
    if (!user) {
        const err = new Error('User not found');
        err.status = 400;
        throw err;
    }

    const ok = await verifyAndConsumeVerifyOtp(email, code);
    if (!ok) {
        const err = new Error('Invalid or expired code');
        err.status = 400;
        throw err;
    }

    user.isVerified = true;
    await user.save();
    return user;
};


// Login flow


/**
 * Authenticate a user by email + password.
 * Returns:
 *   { type: 'ok',         user }           — normal login
 *   { type: '2fa',        email }          — 2FA required (OTP sent)
 *
 * Throws on invalid credentials, unverified email, or Redis/email failures.
 */
export const loginUser = async ({ email, password }) => {
    const user = await User.findOne({ email });

    if (!user || !(await comparePassword(password, user.password))) {
        const err = new Error('Invalid email or password');
        err.status = 401;
        throw err;
    }

    if (!user.isVerified) {
        const err = new Error('Please verify your email first.');
        err.status = 401;
        throw err;
    }

    if (user.twoFactorEnabled) {
        const code = generateOtp();

        try {
            await set2faOtp(user.email, code);
        } catch (redisErr) {
            console.error('Redis (2FA OTP):', redisErr);
            const err = new Error('Could not send login code. Try again.');
            err.status = 500;
            throw err;
        }

        await sendEmail({
            to: user.email,
            subject: 'TaskMate - 2FA Login Code',
            text: `<h1>Login Verification</h1><p>Your code is: <b>${code}</b></p>`,
        });

        return { type: '2fa', email: user.email };
    }

    return { type: 'ok', user };
};


// Google Auth flow

/**
 * Authenticate a user via Google OAuth token.
 * Verifies the token, finds or creates the user (with a random password),
 * and returns the user object.
 */
export const googleLogin = async ({ credential }) => {
    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    
    // Verify the Google token
    const ticket = await client.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID,
    });
    
    const payload = ticket.getPayload();
    const { email, name, picture } = payload;
    
    if (!email) {
        const err = new Error('Google token did not contain an email');
        err.status = 400;
        throw err;
    }
    
    // Check if user exists
    let user = await User.findOne({ email });
    
    if (user) {
        // If they exist but haven't verified email, Google essentially verifies it
        if (!user.isVerified) {
            user.isVerified = true;
            await user.save();
        }
        return { type: 'ok', user };
    }
    
    // If user does not exist, create a new one
    // Generate a random secure password for the newly created user
    const randomPassword = crypto.randomBytes(16).toString('hex');
    const hashedPassword = await hashPassword(randomPassword);
    
    user = await User.create({
        fullname: name,
        email: email,
        password: hashedPassword,
        avatar: picture || '',
        isVerified: true // Google verified emails are considered verified
    });
    
    return { type: 'ok', user };
};


// 2FA verification


/**
 * Verify a 2FA OTP for login.
 * Returns the user doc on success; throws on failure.
 */
export const verify2FACode = async ({ email, code }) => {
    const user = await User.findOne({ email });
    if (!user || !user.twoFactorEnabled) {
        const err = new Error('Invalid or expired 2FA code');
        err.status = 401;
        throw err;
    }

    const ok = await verifyAndConsume2faOtp(email, code);
    if (!ok) {
        const err = new Error('Invalid or expired 2FA code');
        err.status = 401;
        throw err;
    }

    return user;
};


// Password reset flow


/**
 * Initiate a password-reset request.
 * Sets reset token on user, sends email.
 * Throws on unknown email or email send failure.
 */
export const initiatePasswordReset = async ({ email }) => {
    const user = await User.findOne({ email });
    if (!user) {
        const err = new Error('User not found');
        err.status = 404;
        throw err;
    }

    const rawToken = applyResetToken(user);
    await user.save();

    const resetUrl = `${getFrontendBaseUrl()}/reset-password/${rawToken}`;
    const message = `
        <h1>Password Reset Request</h1>
        <p>Click the link below to reset your password:</p>
        <a href="${resetUrl}" clicktracking=off>${resetUrl}</a>
        <p>If you didn't request this, please ignore this email.</p>
    `;

    try {
        await sendEmail({ to: user.email, subject: 'TaskMate Password Reset', text: message });
    } catch {
        clearResetToken(user);
        await user.save();
        const err = new Error('Email could not be sent');
        err.status = 500;
        throw err;
    }
};

/**
 * Complete a password reset using a raw token from the URL.
 * Throws if token is invalid or expired.
 */
export const resetPassword = async ({ rawToken, newPassword }) => {
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    const user = await User.findOne({
        resetPasswordToken: hashedToken,
        resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
        const err = new Error('Invalid or expired token');
        err.status = 400;
        throw err;
    }

    user.password = await hashPassword(newPassword);
    clearResetToken(user);
    await user.save();
};


// Profile update


/**
 * Update a user's profile (name, avatar, password).
 * Returns the updated user doc.
 */
export const updateUserProfile = async ({ userId, fullname, password, currentPassword, avatarPath, removeAvatar }) => {
    const user = await User.findById(userId).select('+password');
    if (!user) {
        const err = new Error('User not found');
        err.status = 404;
        throw err;
    }

    if (fullname) user.fullname = fullname;

    if (avatarPath) user.avatar = avatarPath;

    if (removeAvatar === 'true') user.avatar = '';

    if (password) {
        if (!currentPassword) {
            const err = new Error('Current password is required');
            err.status = 400;
            throw err;
        }
        const isMatch = await comparePassword(currentPassword, user.password);
        if (!isMatch) {
            const err = new Error('Current password is incorrect');
            err.status = 400;
            throw err;
        }
        user.password = await hashPassword(password);
    }

    return user.save();
};


// 2FA toggle


/**
 * Toggle 2FA on/off for a user.
 * Returns { twoFactorEnabled }.
 */
export const toggle2FA = async (userId) => {
    const user = await User.findById(userId);
    user.twoFactorEnabled = !user.twoFactorEnabled;
    await user.save();
    return { twoFactorEnabled: user.twoFactorEnabled };
};


// Activity stats


/**
 * Get aggregate activity stats for a user over the last 30 days.
 */
export const getActivityStats = async (userId) => {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const [workspacesCount, projectsCount, tasksCount] = await Promise.all([
        Workspace.countDocuments({ 'members.user': userId }),
        Project.countDocuments({ 'members.user': userId }),
        Card.countDocuments({
            assignees: userId,
            updatedAt: { $gte: thirtyDaysAgo },
        }),
    ]);
    return { workspacesCount, projectsCount, tasksCount };
};
