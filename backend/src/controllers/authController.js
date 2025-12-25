import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import generateToken from '../utils/generateToken.js';
import sendEmail from '../utils/sendEmail.js';
import crypto from 'crypto';



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

        // Create User (Not verified yet)
        const user = await User.create({
            fullname,
            email,
            password: hashedPassword,
            verificationCode: code,
            verificationCodeExpires: Date.now() + 10 * 60 * 1000 // 10 Minutes
        });

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
                // If email fails, delete user so they can try again
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

        // Check if code matches and hasn't expired
        if (user.verificationCode === code && user.verificationCodeExpires > Date.now()) {
            
            user.isVerified = true;
            user.verificationCode = undefined;
            user.verificationCodeExpires = undefined;
            await user.save();

            // Log them in now
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

        // 1. Check if user exists
        const user = await User.findOne({ email });

        // 2. Check password
        if (user && (await bcrypt.compare(password, user.password))) {

             if (!user.isVerified) {
                return res.status(401).json({ message: "Please verify your email first." });
            }
            
            // 3. Generate Token (Set Cookie)
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
    // 1. Clear the cookie
    res.cookie('jwt', '', {
        httpOnly: true,
        expires: new Date(0) // Expire immediately
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
        const resetUrl = `http://localhost:5173/reset-password/${resetToken}`;

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
        res.status(500).json({ message: "Server Error",  error });
    }
};




