import express from 'express';
import { createProject, deleteProject, getProjectsByWorkspace, getProjectById } from '../controllers/projectController.js';
import protect from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, getProjectsByWorkspace);
router.get('/:id', protect, getProjectById);
router.post('/', protect, createProject);
router.delete('/:id', protect, deleteProject);

export default router;
