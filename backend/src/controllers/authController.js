import generateToken from '../utils/generateToken.js';
import upload from '../config/cloudinary.js';
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
export const registerUser = async (req, res) => {
    try {
        const { fullname, email, password } = req.body;
        const result = await registerUserService({ fullname, email, password });
        res.status(201).json({
            message: 'Registration successful! Please check your email for the code.',
            email: result.email,
        });
    } catch (error) {
        res.status(error.status || 500).json({ message: error.message || 'Server Error' });
    }
};

// POST /api/auth/verify-email
export const verifyEmail = async (req, res) => {
    try {
        const { email, code } = req.body;
        const user = await verifyUserEmail({ email, code });
        generateToken(res, user._id);
        res.status(200).json({
            _id: user._id,
            fullname: user.fullname,
            email: user.email,
            message: 'Email verified successfully!',
        });
    } catch (error) {
        res.status(error.status || 500).json({ message: error.message || 'Server Error' });
    }
};

// POST /api/auth/login
export const loginUser = async (req, res) => {
    try {
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
    } catch (error) {
        res.status(error.status || 500).json({ message: error.message || 'Server Error' });
    }
};

// POST /api/auth/google
export const googleLogin = async (req, res) => {
    try {
        const { credential } = req.body;
        const result = await googleLoginService({ credential });

        generateToken(res, result.user._id);
        res.json({
            _id: result.user._id,
            fullname: result.user.fullname,
            email: result.user.email,
            message: 'Google login successful!',
        });
    } catch (error) {
        console.error('Google login error:', error);
        res.status(error.status || 500).json({ message: error.message || 'Server Error' });
    }
};

// POST /api/auth/logout
export const logoutUser = (req, res) => {
    res.cookie('jwt', '', {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        expires: new Date(0),
        path: '/',
    });
    res.status(200).json({ message: 'Logged out successfully' });
};

// POST /api/auth/forgot-password
export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        await initiatePasswordReset({ email });
        res.status(200).json({ message: 'Email sent' });
    } catch (error) {
        res.status(error.status || 500).json({ message: error.message || 'Server Error' });
    }
};

// PUT /api/auth/reset-password/:token
export const resetPassword = async (req, res) => {
    try {
        await resetPasswordService({ rawToken: req.params.token, newPassword: req.body.password });
        res.status(200).json({ message: 'Password updated successully! You can login now.' });
    } catch (error) {
        res.status(error.status || 500).json({ message: error.message || 'Server Error' });
    }
};

// PUT /api/auth/profile
export const updateProfile = async (req, res) => {
    try {
        const updatedUser = await updateUserProfile({
            userId: req.user._id,
            fullname: req.body.fullname,
            password: req.body.password,
            currentPassword: req.body.currentPassword,
            avatarPath: req.file?.path,
            removeAvatar: req.body.removeAvatar,
        });
        res.json(buildUserResponse(updatedUser));
    } catch (error) {
        res.status(error.status || 500).json({ message: error.message || 'Server Error' });
    }
};

// PUT /api/auth/2fa/toggle
export const toggle2FA = async (req, res) => {
    try {
        const { twoFactorEnabled } = await toggle2FAService(req.user._id);
        res.json({
            message: `2FA is now ${twoFactorEnabled ? 'Enabled' : 'Disabled'}`,
            twoFactorEnabled,
        });
    } catch (error) {
        res.status(error.status || 500).json({ message: error.message || 'Server Error' });
    }
};

// POST /api/auth/login-2fa
export const verify2FALogin = async (req, res) => {
    try {
        const { email, code } = req.body;
        const user = await verify2FACode({ email, code });
        generateToken(res, user._id);
        res.json({
            _id: user._id,
            fullname: user.fullname,
            email: user.email,
            message: 'Logged in successfully!',
        });
    } catch (error) {
        res.status(error.status || 500).json({ message: error.message || 'Server Error' });
    }
};

// GET /api/auth/activity-stats
export const getActivityStats = async (req, res) => {
    try {
        const stats = await getActivityStatsService(req.user._id);
        res.json(stats);
    } catch (error) {
        res.status(error.status || 500).json({ message: error.message || 'Server Error' });
    }
};
