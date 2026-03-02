import express from 'express';
import protect from '../middleware/authMiddleware.js';
import {
    createMeeting,
    deleteMeeting,
    getMeetings,
    updateMeeting,
} from '../controllers/meetingController.js';

const router = express.Router();

router.get('/', protect, getMeetings);
router.post('/', protect, createMeeting);
router.put('/:id', protect, updateMeeting);
router.delete('/:id', protect, deleteMeeting);

export default router;
