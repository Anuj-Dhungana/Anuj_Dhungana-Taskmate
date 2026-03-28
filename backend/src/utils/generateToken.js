import jwt from 'jsonwebtoken';

const generateToken = (res, userId) => {
    // 1. Create the token
    const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
        expiresIn: '30d' // User stays logged in for 30 days
    });

    // 2. Save it in a secure cookie
    res.cookie('jwt', token, {
        httpOnly: true,
        secure: true, // ALWAYS true for cross-site (Render is HTTPS)
        sameSite: 'none', // ALWAYS none for cross-site cookies
        maxAge: 30 * 24 * 60 * 60 * 1000,
        path: '/'
    });
};

export default generateToken;