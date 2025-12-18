import express from 'express';
import { registerUser } from '../controllers/authcontroller.js';
import { loginUser } from '../controllers/authcontroller.js';
import { logoutUser } from '../controllers/authcontroller.js';

const router = express.Router();

// Define the route
router.post('/register', registerUser);
router.post('/login', loginUser); 
router.post('/logout', logoutUser);

export default router;