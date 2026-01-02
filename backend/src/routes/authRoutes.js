import express from 'express';
import { registerUser } from '../controllers/authcontroller.js';
import { loginUser } from '../controllers/authcontroller.js';
import { logoutUser } from '../controllers/authcontroller.js';
import protect  from '../middleware/authMiddleware.js';
import { verifyEmail } from '../controllers/authcontroller.js';
import { forgotPassword } from '../controllers/authcontroller.js';
import { resetPassword } from '../controllers/authcontroller.js';
import { updateProfile } from '../controllers/authcontroller.js';
import { toggle2FA } from '../controllers/authcontroller.js';
import { verify2FALogin } from '../controllers/authcontroller.js';



const router = express.Router();

// Define the route
router.post('/register', registerUser);
router.post('/login', loginUser); 
router.post('/logout', logoutUser);
router.post('/verify-email', verifyEmail);
router.post('/forgot-password', forgotPassword);
router.put('/reset-password/:token', resetPassword);
router.put('/profile', protect, updateProfile); 
router.put('/2fa/toggle', protect, toggle2FA);  
router.post('/login-2fa', verify2FALogin);    

router.get('/profile', protect, (req, res) => {
    res.json(req.user);
});
export default router;