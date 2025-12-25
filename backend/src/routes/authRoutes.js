import express from 'express';
import { registerUser } from '../controllers/authcontroller.js';
import { loginUser } from '../controllers/authcontroller.js';
import { logoutUser } from '../controllers/authcontroller.js';
import protect  from '../middleware/authMiddleware.js';
import { verifyEmail } from '../controllers/authcontroller.js';



const router = express.Router();

// Define the route
router.post('/register', registerUser);
router.post('/login', loginUser); 
router.post('/logout', logoutUser);
router.post('/verify-email', verifyEmail);


router.get('/profile', protect, (req, res) => {
    res.json(req.user);
});
export default router;