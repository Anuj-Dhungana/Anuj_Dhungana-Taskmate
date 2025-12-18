import express from 'express';
import { registerUser } from '../controllers/authcontroller.js';

const router = express.Router();

// Define the route
router.post('/register', registerUser);

export default router;