import express from 'express';
import {
    createWorkspace,
    getMyWorkspaces,
    getWorkspaceDetails,
    updateWorkspace,
    transferWorkspaceOwnership,
} from '../controllers/workspaceController.js';
import protect from '../middleware/authMiddleware.js';
import { inviteUserToWorkspace } from '../controllers/workspaceController.js';
import { updateMemberRole } from '../controllers/workspaceController.js';
import { removeMember } from '../controllers/workspaceController.js';
import checkWorkspaceRole from '../middleware/roleMiddleware.js';
import { deleteWorkspace } from '../controllers/workspaceController.js';
import {
    initiateWorkspaceKhaltiPayment,
    verifyWorkspaceKhaltiPayment,
} from '../controllers/billingController.js';


const router = express.Router();


router.route('/')
    .post(protect, createWorkspace)
    .get(protect, getMyWorkspaces);
router.route('/:id')
    .get(protect, getWorkspaceDetails)
    .put(protect, checkWorkspaceRole(['owner']), updateWorkspace)
    .delete(protect, checkWorkspaceRole(['owner']), deleteWorkspace);
router.post('/:id/billing/khalti/initiate', protect, checkWorkspaceRole(['owner']), initiateWorkspaceKhaltiPayment);
router.post('/:id/billing/khalti/verify', protect, checkWorkspaceRole(['owner']), verifyWorkspaceKhaltiPayment);

router.post('/:id/invite', protect, checkWorkspaceRole(['owner', 'admin']), inviteUserToWorkspace);
router.put('/:id/role', protect, checkWorkspaceRole(['owner']), updateMemberRole);
router.post('/:id/transfer-ownership', protect, checkWorkspaceRole(['owner']), transferWorkspaceOwnership);
router.delete('/:id/members/:memberId', protect, checkWorkspaceRole(['owner', 'admin']), removeMember);

export default router;
