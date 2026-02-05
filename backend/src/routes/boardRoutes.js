import express from 'express';
import { getBoard, createList, createCard, updateCardOrder, getWorkspaceCards, getMyTasks, getWorkspaceStats, getWorkspaceAnalytics } from '../controllers/boardController.js';
import protect from '../middleware/authMiddleware.js';
import { deleteCard } from '../controllers/boardController.js';
import upload from '../config/cloudinary.js';
import { updateCard } from '../controllers/boardController.js';

const router = express.Router();

router.get('/workspace-cards', protect, getWorkspaceCards);
router.get('/my-tasks', protect, getMyTasks);
router.get('/workspace-stats', protect, getWorkspaceStats);
router.get('/workspace-analytics', protect, getWorkspaceAnalytics);
router.get('/:projectId', protect, getBoard);
router.post('/lists', protect, createList);
router.post('/cards', protect, createCard);
router.put('/cards/reorder', protect, updateCardOrder);
router.delete('/cards/:id', protect, deleteCard);
router.put('/cards/:id', protect, upload.single('file'), updateCard);

export default router;
