import express from 'express';
import { createWorkspace, getMyWorkspaces, getWorkspaceDetails, updateWorkspace } from '../controllers/workspaceController.js';
import protect from '../middleware/authMiddleware.js';
import { inviteUserToWorkspace } from '../controllers/workspaceController.js';
import { updateMemberRole } from '../controllers/workspaceController.js';
import { removeMember } from '../controllers/workspaceController.js';
import checkWorkspaceRole from '../middleware/roleMiddleware.js';
import { deleteWorkspace } from '../controllers/workspaceController.js';


const router = express.Router();


router.route('/')
    .post(protect, createWorkspace)
    .get(protect, getMyWorkspaces);
router.route('/:id')
    .get(protect, getWorkspaceDetails)
    .put(protect, checkWorkspaceRole(['owner']), updateWorkspace)
    .delete(protect, checkWorkspaceRole(['owner']), deleteWorkspace);
router.post('/:id/invite', protect, checkWorkspaceRole(['owner', 'admin']), inviteUserToWorkspace);
router.put('/:id/role', protect, checkWorkspaceRole(['owner', 'admin']), updateMemberRole);
router.delete('/:id/members/:memberId', protect, checkWorkspaceRole(['owner', 'admin']), removeMember);

export default router;
