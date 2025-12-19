import express from 'express';
import { createWorkspace, getMyWorkspaces } from '../controllers/workspaceController.js';
import protect from '../middleware/authMiddleware.js';

const router = express.Router();

// All workspace routes need you to be logged in
router.route('/')
    .post(protect, createWorkspace)
    .get(protect, getMyWorkspaces);

export default router;