import express from 'express';
import protect from '../middleware/authMiddleware.js';
import { createChannel, deleteChannel, getWorkspaceChannels, renameChannel } from '../controllers/channelController.js';

const router = express.Router();

router.get('/workspace/:workspaceId', protect, getWorkspaceChannels);
router.post('/', protect, createChannel);
router.put('/:id', protect, renameChannel);
router.delete('/:id', protect, deleteChannel);

export default router;
