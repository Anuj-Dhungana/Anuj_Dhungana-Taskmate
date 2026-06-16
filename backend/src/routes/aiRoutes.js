import express from 'express';
import { generateAiContent } from '../controllers/aiController.js';
import protect from '../middleware/authMiddleware.js';

const router = express.Router();

// All AI routes should be protected
router.post('/generate', protect, generateAiContent);

export default router;
