import jwt from 'jsonwebtoken';

const generateToken = (res, userId) => {
    // 1. Create the token
    const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
        expiresIn: '30d' // User stays logged in for 30 days
    });

    // 2. Save it in a secure cookie
    res.cookie('jwt', token, {
        httpOnly: true, // Prevents JavaScript from reading the cookie (Security)
        secure: process.env.NODE_ENV !== 'development', // Use HTTPS in production
        sameSite: 'strict', // CSRF protection
        maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days in milliseconds
    });
};

export default generateToken;