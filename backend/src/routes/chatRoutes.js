import express from 'express';
import { getMessages, sendMessage, deleteMessage, votePoll, toggleReaction } from '../controllers/chatController.js';
import protect from '../middleware/authMiddleware.js';
import upload from '../config/cloudinary.js';
import validate from '../middleware/validate.js';
import {
    getMessagesValidation,
    sendMessageValidation,
    deleteMessageValidation,
    votePollValidation,
    toggleReactionValidation
} from '../validators/chatValidator.js';

const router = express.Router();

router.get('/:channelId', protect, getMessagesValidation, validate, getMessages);
router.post('/', protect, sendMessageValidation, validate, sendMessage);
router.post('/upload', protect, upload.array('attachments', 10), (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ message: "No files uploaded" });
        }
        const files = req.files.map(file => ({
            url: file.path,
            public_id: file.filename,
            original_filename: file.originalname,
            resource_type: file.mimetype.startsWith('video/') ? 'video' : 
                           file.mimetype.startsWith('audio/') ? 'audio' : 
                           file.mimetype.startsWith('image/') ? 'image' : 'raw',
        }));
        res.status(200).json({ files });
    } catch (error) {
        console.error("Upload error", error);
        res.status(500).json({ message: "File upload failed" });
    }
});
router.post('/:id/vote', protect, votePollValidation, validate, votePoll);
router.post('/:id/react', protect, toggleReactionValidation, validate, toggleReaction);
router.delete('/:id', protect, deleteMessageValidation, validate, deleteMessage);

export default router;
