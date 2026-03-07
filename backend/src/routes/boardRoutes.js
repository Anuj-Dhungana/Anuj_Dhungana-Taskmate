import express from 'express';
import {
    getBoard,
    createList,
    createCard,
    updateCardOrder,
    getWorkspaceCards,
    getMyTasks,
    getWorkspaceStats,
    getWorkspaceAnalytics,
    addCardComment,
    deleteCardComment,
    addCardSubtask,
    toggleCardSubtask,
    deleteCardSubtask,
    archiveCard,
} from '../controllers/boardController.js';
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
router.post('/cards/:id/comments', protect, addCardComment);
router.delete('/cards/:id/comments/:commentId', protect, deleteCardComment);
router.post('/cards/:id/subtasks', protect, addCardSubtask);
router.put('/cards/:id/subtasks/:subtaskId', protect, toggleCardSubtask);
router.delete('/cards/:id/subtasks/:subtaskId', protect, deleteCardSubtask);
router.put('/cards/:id/archive', protect, archiveCard);
router.put('/cards/reorder', protect, updateCardOrder);
router.delete('/cards/:id', protect, deleteCard);
router.put('/cards/:id', protect, upload.single('file'), updateCard);

export default router;
