import crypto from 'crypto';

const isProduction = process.env.NODE_ENV === 'production';

const cookieOptions = {
    httpOnly: false, // Must be false so frontend JS (Axios) can read it
    secure: isProduction, // Use true in production if using SameSite=None
    sameSite: isProduction ? 'none' : 'lax', // Browsers reject SameSite=None without Secure
    path: '/',
};

/**
 * Middleware to generate and set the CSRF token cookie if it doesn't exist.
 * The frontend will read this cookie and send its value in the X-XSRF-TOKEN header.
 */
export const generateCsrfToken = (req, res, next) => {
    let token = req.cookies['XSRF-TOKEN'];
    if (!token) {
        token = crypto.randomBytes(32).toString('hex');
        res.cookie('XSRF-TOKEN', token, cookieOptions);
    }
    // Set token in header so cross-domain SPAs can read it manually
    res.setHeader('X-CSRF-TOKEN', token);
    req.csrfToken = token;
    next();
};

/**
 * Middleware to validate the CSRF token on state-changing requests.
 * Uses the Double Submit Cookie pattern.
 */
export const validateCsrfToken = (req, res, next) => {
    console.log("[CSRF DEBUG]", {
        path: req.originalUrl,
        method: req.method,
        cookieHeader: req.headers.cookie,
        xsrfCookie: req.cookies['XSRF-TOKEN'],
        xsrfHeader: req.headers['x-xsrf-token']
    });

    // Skip CSRF validation for safe methods
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
        return next();
    }

    // Skip CSRF validation for authentication routes that don't depend on an established session
    const excludedExactPaths = [
        '/api/auth/login',
        '/api/auth/register',
        '/api/auth/google',
        '/api/auth/forgot-password',
        '/api/auth/verify-email',
        '/api/auth/login-2fa',
        '/api/auth/logout'
    ];

    const isExcluded = 
        excludedExactPaths.includes(req.originalUrl) || 
        req.originalUrl.startsWith('/api/auth/reset-password/');

    if (isExcluded) {
        return next();
    }

    const cookieToken = req.cookies['XSRF-TOKEN'];
    const headerToken = req.headers['x-xsrf-token'];

    if (!cookieToken || !headerToken || cookieToken !== headerToken) {
        console.warn(`[CSRF] Invalid token for ${req.originalUrl}. Cookie: ${cookieToken ? 'present' : 'missing'}, Header: ${headerToken ? 'present' : 'missing'}`);
        return res.status(403).json({ message: 'Invalid CSRF Token. Request blocked.' });
    }

    next();
};
