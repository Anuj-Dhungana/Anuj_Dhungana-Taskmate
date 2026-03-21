import express from 'express';
import protect from '../middleware/authMiddleware.js';
import { createChannel, createOrGetDM, deleteChannel, getWorkspaceChannels, getWorkspaceDMs, renameChannel, addMembersToChannel } from '../controllers/channelController.js';

const router = express.Router();

router.get('/workspace/:workspaceId', protect, getWorkspaceChannels);
router.get('/workspace/:workspaceId/dms', protect, getWorkspaceDMs);
router.post('/', protect, createChannel);
router.post('/dm', protect, createOrGetDM);
router.put('/:id', protect, renameChannel);
router.post('/:id/members', protect, addMembersToChannel);
router.delete('/:id', protect, deleteChannel);

export default router;
