import express from 'express';
import { getNotifications, markAsRead, markAllRead, getMentions } from '../controllers/notificationController.js';
import protect from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, getNotifications);
router.get('/mentions', protect, getMentions);
router.put('/:id/read', protect, markAsRead);
router.put('/read-all', protect, markAllRead);

export default router;