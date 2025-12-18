import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import generateToken from '../utils/generateToken.js';

export const registerUser = async (req, res) => {
    try {
        const { fullname, email, password } = req.body;

        // 1. Check if user already exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // 2. Hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 3. Create user
        const user = await User.create({
            fullname,
            email,
            password: hashedPassword
        });

        if (user) {
            // 4. Generate Token & Set Cookie
            generateToken(res, user._id);

            res.status(201).json({
                _id: user._id,
                fullname: user.fullname,
                email: user.email,
                message: "User registered successfully!"
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

export const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. Check if user exists
        const user = await User.findOne({ email });

        // 2. Check password
        if (user && (await bcrypt.compare(password, user.password))) {
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