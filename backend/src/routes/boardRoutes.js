import express from 'express';
import { getBoard, createList, createCard, updateCardOrder } from '../controllers/boardController.js';
import protect from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/:projectId', protect, getBoard);
router.post('/lists', protect, createList);
router.post('/cards', protect, createCard);
router.put('/cards/reorder', protect, updateCardOrder);

export default router;