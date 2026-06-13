import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const protect = async (req, res, next) => {
    let token;

    // Read JWT from the 'jwt' cookie
    token = req.cookies.jwt;

    if (token) {
        try {
            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Get user from DB (exclude password)
            req.user = await User.findById(decoded.userId).select('-password');

            if (!req.user) {
                const err = new Error('Not authorized, user not found');
                err.statusCode = 401;
                return next(err);
            }

            next(); // Move to the controller
        } catch (error) {
            const err = new Error('Not authorized, invalid token');
            err.statusCode = 401;
            next(err);
        }
    } else {
        const err = new Error('Not authorized, no token');
        err.statusCode = 401;
        next(err);
    }
};

export default protect;