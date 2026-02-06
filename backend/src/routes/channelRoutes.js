import express from 'express';
import protect from '../middleware/authMiddleware.js';
import { createChannel, createOrGetDM, deleteChannel, getWorkspaceChannels, getWorkspaceDMs, renameChannel } from '../controllers/channelController.js';

const router = express.Router();

router.get('/workspace/:workspaceId', protect, getWorkspaceChannels);
router.get('/workspace/:workspaceId/dms', protect, getWorkspaceDMs);
router.post('/', protect, createChannel);
router.post('/dm', protect, createOrGetDM);
router.put('/:id', protect, renameChannel);
router.delete('/:id', protect, deleteChannel);

export default router;
