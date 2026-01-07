import express from 'express';
import { getMessages, sendMessage } from '../controllers/chatController.js';
import protect from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/:channelId', protect, getMessages);
router.post('/', protect, sendMessage);

export default router;