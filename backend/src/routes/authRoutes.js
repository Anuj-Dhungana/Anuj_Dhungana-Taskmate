import express from 'express';
import { registerUser } from '../controllers/authController.js';
import { loginUser } from '../controllers/authController.js';
import { googleLogin } from '../controllers/authController.js';
import { logoutUser } from '../controllers/authController.js';
import protect  from '../middleware/authMiddleware.js';
import { verifyEmail } from '../controllers/authController.js';
import { forgotPassword } from '../controllers/authController.js';
import { resetPassword } from '../controllers/authController.js';
import { updateProfile } from '../controllers/authController.js';
import { toggle2FA } from '../controllers/authController.js';
import { verify2FALogin } from '../controllers/authController.js';
import { getActivityStats } from '../controllers/authController.js';
import upload from '../config/cloudinary.js';

// Validators
import {
    registerValidation,
    loginValidation,
    twoFAValidation,
    forgotPasswordValidation,
    resetPasswordValidation,
    updateProfileValidation,
} from '../validators/authValidator.js';
import validate from '../middleware/validate.js';

// Rate limiters
import { authLimiter, registerLimiter, passwordResetLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Define the routes with validation and rate limiting
router.post('/register', registerLimiter, registerValidation, validate, registerUser);
router.post('/login', authLimiter, loginValidation, validate, loginUser);
router.post('/google', googleLogin);
router.post('/logout', logoutUser);
router.post('/verify-email', verifyEmail);
router.post('/forgot-password', passwordResetLimiter, forgotPasswordValidation, validate, forgotPassword);
router.put('/reset-password/:token', resetPasswordValidation, validate, resetPassword);
router.put('/profile', protect, upload.single('avatar'), updateProfile); 
router.put('/2fa/toggle', protect, toggle2FA);  
router.post('/login-2fa', authLimiter, twoFAValidation, validate, verify2FALogin);    

router.get('/profile', protect, (req, res) => {
    res.json(req.user);
});

router.get('/activity-stats', protect, getActivityStats);

export default router;