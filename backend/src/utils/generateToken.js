import jwt from 'jsonwebtoken';

const generateToken = (res, userId) => {
    // 1. Create the token
    const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
        expiresIn: '30d' // User stays logged in for 30 days
    });

    // 2. Save it in a secure cookie
    const isProduction = process.env.NODE_ENV !== 'development';
    
    res.cookie('jwt', token, {
        httpOnly: true, // Prevents JavaScript from reading the cookie (Security)
        secure: isProduction, // Use HTTPS in production
        sameSite: isProduction ? 'none' : 'strict', // Allow cross-domain cookies in production
        maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days in milliseconds
    });
};

export default generateToken;