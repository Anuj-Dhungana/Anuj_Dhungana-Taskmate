import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import generateToken from '../utils/generateToken.js';
import sendEmail from '../utils/sendEmail.js';
import crypto from 'crypto';
import Workspace from '../models/Workspace.js';
import Project from '../models/Project.js';
import Card from '../models/Card.js';
import {
    setVerifyOtp,
    verifyAndConsumeVerifyOtp,
    deleteVerifyOtp,
    set2faOtp,
    verifyAndConsume2faOtp,
} from '../services/otpRedisService.js';

const getFrontendBaseUrl = () =>
    String(process.env.FRONTEND_URL || 'http://localhost:5173')
        .trim()
        .replace(/\/+$/, '');



export const registerUser = async (req, res) => {
    try {
        const { fullname, email, password } = req.body;

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Generate 6-digit Code
        const code = Math.floor(100000 + Math.random() * 900000).toString();

        // Hash Password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create User (Not verified yet). OTP lives in Redis with TTL.
        const user = await User.create({
            fullname,
            email,
            password: hashedPassword,
        });

        try {
            await setVerifyOtp(email, code);
        } catch (redisErr) {
            await User.deleteOne({ _id: user._id });
            console.error('Redis (verify OTP):', redisErr);
            return res.status(500).json({ message: 'Could not store verification code. Try again.' });
        }

        if (user) {
            // Send Email
            try {
                await sendEmail({
                    to: user.email,
                    subject: 'TaskMate - Verify your email',
                    text: `<h1>Welcome to TaskMate!</h1>
                           <p>Your verification code is:</p>
                           <h2 style="color:blue;">${code}</h2>
                           <p>This code expires in 10 minutes.</p>`
                });

                res.status(201).json({
                    message: "Registration successful! Please check your email for the code.",
                    email: user.email // Send email back so frontend knows where to send code
                });
            } catch (error) {
                await deleteVerifyOtp(email);
                await User.deleteOne({ _id: user._id });
                return res.status(500).json({ message: "Email could not be sent. Please try again." });
            }
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};


export const verifyEmail = async (req, res) => {
    try {
        const { email, code } = req.body;

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({ message: "User not found" });
        }

        const ok = await verifyAndConsumeVerifyOtp(email, code);
        if (ok) {
            user.isVerified = true;
            await user.save();

            generateToken(res, user._id);

            res.status(200).json({
                _id: user._id,
                fullname: user.fullname,
                email: user.email,
                message: "Email verified successfully!"
            });
        } else {
            res.status(400).json({ message: "Invalid or expired code" });
        }
    } catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
};

export const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (user && (await bcrypt.compare(password, user.password))) {

            if (!user.isVerified) {
                return res.status(401).json({ message: "Please verify your email first." });
            }


            if (user.twoFactorEnabled) {
                const code = Math.floor(100000 + Math.random() * 900000).toString();

                try {
                    await set2faOtp(user.email, code);
                } catch (redisErr) {
                    console.error('Redis (2FA OTP):', redisErr);
                    return res.status(500).json({ message: 'Could not send login code. Try again.' });
                }

                // Send Email
                await sendEmail({
                    to: user.email,
                    subject: 'TaskMate - 2FA Login Code',
                    text: `<h1>Login Verification</h1><p>Your code is: <b>${code}</b></p>`
                });

                // 4. Return special status (NOT the token)
                return res.json({
                    status: '2fa_required',
                    email: user.email,
                    message: "2FA Code sent to your email"
                });
            }

            // Normal Login (No 2FA)
            generateToken(res, user._id);
            res.json({
                _id: user._id,
                fullname: user.fullname,
                email: user.email,
                message: "Logged in successfully!"
            });

        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};


export const logoutUser = (req, res) => {
    // Clear the cookie (must match same attributes as login cookie)
    res.cookie('jwt', '', {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        expires: new Date(0), // Expire immediately
        path: '/'
    });

    res.status(200).json({ message: 'Logged out successfully' });
};


export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // 1. Generate Token
        const resetToken = crypto.randomBytes(32).toString('hex');

        // 2. Hash token and save to DB (Security best practice)
        // We hash it so even if DB is leaked, tokens are safe
        user.resetPasswordToken = crypto
            .createHash('sha256')
            .update(resetToken)
            .digest('hex');

        // Expires in 10 minutes
        user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

        await user.save();

        // 3. Create Reset URL (Points to Frontend)
        const resetUrl = `${getFrontendBaseUrl()}/reset-password/${resetToken}`;

        const message = `
            <h1>Password Reset Request</h1>
            <p>Click the link below to reset your password:</p>
            <a href="${resetUrl}" clicktracking=off>${resetUrl}</a>
            <p>If you didn't request this, please ignore this email.</p>
        `;

        try {
            await sendEmail({
                to: user.email,
                subject: 'TaskMate Password Reset',
                text: message
            });

            res.status(200).json({ message: "Email sent" });
        } catch (error) {
            user.resetPasswordToken = undefined;
            user.resetPasswordExpire = undefined;
            await user.save();
            return res.status(500).json({ message: "Email could not be sent" });
        }
    } catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
};


export const resetPassword = async (req, res) => {

    try {
        // 1. Get token from URL and hash it (to match DB)
        const resetPasswordToken = crypto
            .createHash('sha256')
            .update(req.params.token)
            .digest('hex');

        // 2. Find user with valid token and non-expired time
        const user = await User.findOne({
            resetPasswordToken,
            resetPasswordExpire: { $gt: Date.now() } // $gt means "Greater Than"
        });

        if (!user) {
            return res.status(400).json({ message: "Invalid or expired token" });
        }

        // 3. Set new password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(req.body.password, salt);

        // 4. Clear reset fields
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;

        await user.save();

        res.status(200).json({ message: "Password updated successully! You can login now." });

    } catch (error) {
        res.status(500).json({ message: "Server Error", error });
    }
};


export const updateProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('+password');

        if (!user) return res.status(404).json({ message: 'User not found' });

        // Update name
        if (req.body.fullname) user.fullname = req.body.fullname;

        // Avatar upload
        if (req.file) {
            user.avatar = req.file.path; // Cloudinary URL
        }

        // Remove avatar
        if (req.body.removeAvatar === 'true') {
            user.avatar = '';
        }

        // Password change — requires currentPassword
        if (req.body.password) {
            if (!req.body.currentPassword) {
                return res.status(400).json({ message: 'Current password is required' });
            }
            const isMatch = await bcrypt.compare(req.body.currentPassword, user.password);
            if (!isMatch) {
                return res.status(400).json({ message: 'Current password is incorrect' });
            }
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(req.body.password, salt);
        }

        const updatedUser = await user.save();

        res.json({
            _id: updatedUser._id,
            fullname: updatedUser.fullname,
            email: updatedUser.email,
            avatar: updatedUser.avatar,
            isVerified: updatedUser.isVerified,
            twoFactorEnabled: updatedUser.twoFactorEnabled,
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};


export const toggle2FA = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        // Flip the status
        user.twoFactorEnabled = !user.twoFactorEnabled;
        await user.save();

        res.json({
            message: `2FA is now ${user.twoFactorEnabled ? 'Enabled' : 'Disabled'}`,
            twoFactorEnabled: user.twoFactorEnabled
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

export const verify2FALogin = async (req, res) => {
    try {
        const { email, code } = req.body;
        const user = await User.findOne({ email });

        if (!user || !user.twoFactorEnabled) {
            return res.status(401).json({ message: "Invalid or expired 2FA code" });
        }

        const ok = await verifyAndConsume2faOtp(email, code);
        if (ok) {
            generateToken(res, user._id);

            res.json({
                _id: user._id,
                fullname: user.fullname,
                email: user.email,
                message: "Logged in successfully!"
            });
        } else {
            res.status(401).json({ message: "Invalid or expired 2FA code" });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

export const getActivityStats = async (req, res) => {
    try {
        const userId = req.user._id;
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

        const [workspacesCount, projectsCount, tasksCount] = await Promise.all([
            Workspace.countDocuments({ 'members.user': userId }),
            Project.countDocuments({ 'members.user': userId }),
            Card.countDocuments({
                assignees: userId,
                updatedAt: { $gte: thirtyDaysAgo },
            }),
        ]);

        res.json({ workspacesCount, projectsCount, tasksCount });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};





