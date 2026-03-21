import express from 'express';
import { getMessages, sendMessage, deleteMessage } from '../controllers/chatController.js';
import protect from '../middleware/authMiddleware.js';
import upload from '../config/cloudinary.js';

const router = express.Router();

router.get('/:channelId', protect, getMessages);
router.post('/', protect, sendMessage);
router.post('/upload', protect, upload.array('attachments', 10), (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ message: "No files uploaded" });
        }
        const files = req.files.map(file => ({
            url: file.path,
            public_id: file.filename,
            original_filename: file.originalname,
            resource_type: file.mimetype.startsWith('video/') ? 'video' : (file.mimetype.startsWith('image/') ? 'image' : 'raw'),
        }));
        res.status(200).json({ files });
    } catch (error) {
        console.error("Upload error", error);
        res.status(500).json({ message: "File upload failed" });
    }
});
router.delete('/:id', protect, deleteMessage);

export default router;
