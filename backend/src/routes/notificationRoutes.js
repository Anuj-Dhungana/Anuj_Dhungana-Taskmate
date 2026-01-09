import express from 'express';
import { getNotifications, markAsRead, markAllRead } from '../controllers/notificationController.js';
import protect from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, getNotifications);
router.put('/:id/read', protect, markAsRead);
router.put('/read-all', protect, markAllRead);

export default router;