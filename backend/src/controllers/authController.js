import generateToken from '../utils/generateToken.js';
import upload from '../config/cloudinary.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import {
    registerUser as registerUserService,
    verifyUserEmail,
    loginUser as loginUserService,
    verify2FACode,
    initiatePasswordReset,
    resetPassword as resetPasswordService,
    updateUserProfile,
    toggle2FA as toggle2FAService,
    getActivityStats as getActivityStatsService,
    buildUserResponse,
    googleLogin as googleLoginService,
} from '../services/userService.js';

// POST /api/auth/register
export const registerUser = asyncHandler(async (req, res) => {
    const { fullname, email, password } = req.body;
    const result = await registerUserService({ fullname, email, password });
    res.status(201).json({
        message: 'Registration successful! Please check your email for the code.',
        email: result.email,
    });
});

// POST /api/auth/verify-email
export const verifyEmail = asyncHandler(async (req, res) => {
    const { email, code } = req.body;
    const user = await verifyUserEmail({ email, code });
    generateToken(res, user._id);
    res.status(200).json({
        _id: user._id,
        fullname: user.fullname,
        email: user.email,
        message: 'Email verified successfully!',
    });
});

// POST /api/auth/login
export const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const result = await loginUserService({ email, password });

    if (result.type === '2fa') {
        return res.json({
            status: '2fa_required',
            email: result.email,
            message: '2FA Code sent to your email',
        });
    }

    generateToken(res, result.user._id);
    res.json({
        _id: result.user._id,
        fullname: result.user.fullname,
        email: result.user.email,
        message: 'Logged in successfully!',
    });
});

// POST /api/auth/google
export const googleLogin = asyncHandler(async (req, res) => {
    const { credential } = req.body;
    const result = await googleLoginService({ credential });

    generateToken(res, result.user._id);
    res.json({
        _id: result.user._id,
        fullname: result.user.fullname,
        email: result.user.email,
        message: 'Google login successful!',
    });
});

// POST /api/auth/logout
export const logoutUser = asyncHandler(async (req, res) => {
    res.cookie('jwt', '', {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        expires: new Date(0),
        path: '/',
    });
    res.status(200).json({ message: 'Logged out successfully' });
});

// POST /api/auth/forgot-password
export const forgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.body;
    await initiatePasswordReset({ email });
    res.status(200).json({ message: 'Email sent' });
});

// PUT /api/auth/reset-password/:token
export const resetPassword = asyncHandler(async (req, res) => {
    await resetPasswordService({ rawToken: req.params.token, newPassword: req.body.password });
    res.status(200).json({ message: 'Password updated successully! You can login now.' });
});

// PUT /api/auth/profile
export const updateProfile = asyncHandler(async (req, res) => {
    const updatedUser = await updateUserProfile({
        userId: req.user._id,
        fullname: req.body.fullname,
        password: req.body.password,
        currentPassword: req.body.currentPassword,
        avatarPath: req.file?.path,
        removeAvatar: req.body.removeAvatar,
    });
    res.json(buildUserResponse(updatedUser));
});

// PUT /api/auth/2fa/toggle
export const toggle2FA = asyncHandler(async (req, res) => {
    const { twoFactorEnabled } = await toggle2FAService(req.user._id);
    res.json({
        message: `2FA is now ${twoFactorEnabled ? 'Enabled' : 'Disabled'}`,
        twoFactorEnabled,
    });
});

// POST /api/auth/login-2fa
export const verify2FALogin = asyncHandler(async (req, res) => {
    const { email, code } = req.body;
    const user = await verify2FACode({ email, code });
    generateToken(res, user._id);
    res.json({
        _id: user._id,
        fullname: user.fullname,
        email: user.email,
        message: 'Logged in successfully!',
    });
});

// GET /api/auth/activity-stats
export const getActivityStats = asyncHandler(async (req, res) => {
    const stats = await getActivityStatsService(req.user._id);
    res.json(stats);
});
