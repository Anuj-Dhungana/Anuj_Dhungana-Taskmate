import { initiateProPayment, verifyProPayment } from '../services/billingService.js';
import { asyncHandler } from '../middleware/errorHandler.js';

// POST /api/workspaces/:id/billing/khalti/initiate
export const initiateWorkspaceKhaltiPayment = asyncHandler(async (req, res) => {
    const result = await initiateProPayment({
        workspace: req.workspace,
        user: req.user,
    });
    res.json(result);
});

// POST /api/workspaces/:id/billing/khalti/verify
export const verifyWorkspaceKhaltiPayment = asyncHandler(async (req, res) => {
    const { pidx } = req.body || {};
    if (!pidx) {
        return res.status(400).json({ message: 'pidx is required' });
    }

    const result = await verifyProPayment({
        workspace: req.workspace,
        pidx,
    });

    if (result.httpStatus) {
        return res.status(result.httpStatus).json({
            status: result.status,
            message: result.message,
        });
    }

    res.json(result);
});
