import express from 'express';
import { createProject, updateProject, deleteProject, getProjectsByWorkspace, getProjectById } from '../controllers/projectController.js';
import protect from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, getProjectsByWorkspace);
router.get('/:id', protect, getProjectById);
router.post('/', protect, createProject);
router.put('/:id', protect, updateProject);
router.delete('/:id', protect, deleteProject);

export default router;
