import { initiateProPayment, verifyProPayment } from '../services/billingService.js';

// POST /api/workspaces/:id/billing/khalti/initiate
export const initiateWorkspaceKhaltiPayment = async (req, res) => {
    try {
        const result = await initiateProPayment({
            workspace: req.workspace,
            user: req.user,
        });
        res.json(result);
    } catch (error) {
        res.status(error?.status || 502).json({
            message: error?.message || 'Failed to initiate Khalti payment',
            providerResponse: error?.providerResponse || null,
        });
    }
};

// POST /api/workspaces/:id/billing/khalti/verify
export const verifyWorkspaceKhaltiPayment = async (req, res) => {
    try {
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
    } catch (error) {
        if (error.verifyStatus === 'failed') {
            return res.status(400).json({
                status: 'failed',
                message: error.message,
                details: error.details,
            });
        }
        res.status(error?.status || 500).json({
            message: error?.message || 'Failed to verify Khalti payment',
            providerResponse: error?.providerResponse || null,
        });
    }
};
