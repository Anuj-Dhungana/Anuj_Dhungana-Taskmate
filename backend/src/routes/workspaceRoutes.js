import express from 'express';
import { createWorkspace, getMyWorkspaces, getWorkspaceDetails } from '../controllers/workspaceController.js';
import protect from '../middleware/authMiddleware.js';
import { inviteUserToWorkspace } from '../controllers/workspaceController.js';

const router = express.Router();

// All workspace routes need you to be logged in
router.route('/')
    .post(protect, createWorkspace)
    .get(protect, getMyWorkspaces);
router.route('/:id').get(protect, getWorkspaceDetails);
router.post('/:id/invite', protect, inviteUserToWorkspace);


export default router;