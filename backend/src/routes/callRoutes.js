import express from 'express';
import protect from '../middleware/authMiddleware.js';
import { createCallToken } from '../controllers/callController.js';

const router = express.Router();

router.post('/token', protect, createCallToken);

export default router;
