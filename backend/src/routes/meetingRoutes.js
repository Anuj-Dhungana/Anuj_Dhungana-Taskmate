import express from 'express';
import protect from '../middleware/authMiddleware.js';
import { createMeeting, getMeetings } from '../controllers/meetingController.js';

const router = express.Router();

router.get('/', protect, getMeetings);
router.post('/', protect, createMeeting);

export default router;
