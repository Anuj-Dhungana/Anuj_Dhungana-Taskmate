import Payment from '../models/Payment.js';
import Subscription from '../models/Subscription.js';
import { WORKSPACE_PLAN } from '../config/workspacePlans.js';
import { initiateKhaltiPayment, lookupKhaltiPayment } from '../services/khaltiService.js';

const PRO_PLAN_PURCHASE_NAME = 'TaskMate Pro Workspace Upgrade';

const getProAmountPaisa = () => {
    const raw = Number.parseInt(process.env.PRO_PRICE_PAISA, 10);
    if (!Number.isFinite(raw) || raw <= 0) {
        const error = new Error('PRO_PRICE_PAISA must be a positive integer');
        error.status = 500;
        throw error;
    }
    return raw;
};

const buildBillingResultUrl = (workspaceId) => {
    const frontendUrl = String(process.env.FRONTEND_URL || '').trim();
    if (!frontendUrl) {
        const error = new Error('FRONTEND_URL is not configured');
        error.status = 500;
        throw error;
    }

    const resultUrl = new URL('/billing/result', frontendUrl);
    resultUrl.searchParams.set('workspaceId', String(workspaceId || ''));
    return resultUrl.toString();
};

const mapKhaltiStatusToPaymentStatus = (status) => {
    const normalized = String(status || '').trim().toLowerCase();
    if (normalized === 'completed') return 'completed';
    if (normalized.includes('cancel')) return 'cancelled';
    if (normalized.includes('refund')) return 'refunded';
    if (normalized.includes('fail')) return 'failed';
    if (normalized.includes('pending') || normalized.includes('initiated')) return 'pending';
    return 'failed';
};

const generatePurchaseOrderId = (workspaceId) =>
    `tm_${workspaceId}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

export const initiateWorkspaceKhaltiPayment = async (req, res) => {
    try {
        const workspace = req.workspace;
        if (!workspace) {
            return res.status(404).json({ message: 'Workspace not found' });
        }

        if (workspace?.settings?.billing?.currentPlan === WORKSPACE_PLAN.PRO) {
            return res.status(400).json({ message: 'This workspace is already on Pro plan' });
        }

        const amount = getProAmountPaisa();
        const purchaseOrderId = generatePurchaseOrderId(workspace._id);
        const returnUrl = buildBillingResultUrl(workspace._id);
        const websiteUrl = String(process.env.FRONTEND_URL || '').trim();

        const payment = await Payment.create({
            workspace: workspace._id,
            user: req.user._id,
            plan: WORKSPACE_PLAN.PRO,
            amount,
            paymentMethod: 'khalti',
            purchaseOrderId,
            status: 'pending',
            providerResponse: {
                initiatedAt: new Date().toISOString(),
            },
        });

        try {
            const khaltiResponse = await initiateKhaltiPayment({
                return_url: returnUrl,
                website_url: websiteUrl,
                amount,
                purchase_order_id: purchaseOrderId,
                purchase_order_name: PRO_PLAN_PURCHASE_NAME,
                customer_info: {
                    name: req.user?.fullname || 'TaskMate User',
                    email: req.user?.email || '',
                },
            });

            payment.khaltiPidx = khaltiResponse?.pidx || '';
            payment.providerResponse = {
                ...(payment.providerResponse || {}),
                initiateResponse: khaltiResponse,
            };
            await payment.save();

            return res.json({
                paymentUrl: khaltiResponse?.payment_url,
                pidx: khaltiResponse?.pidx,
                purchaseOrderId,
                amount,
            });
        } catch (providerError) {
            payment.status = 'failed';
            payment.providerResponse = {
                ...(payment.providerResponse || {}),
                initiateError: providerError?.providerResponse || providerError?.message || 'Khalti initiate failed',
            };
            await payment.save();

            return res.status(providerError?.status || 502).json({
                message: providerError?.message || 'Failed to initiate Khalti payment',
                providerResponse: providerError?.providerResponse || null,
            });
        }
    } catch (error) {
        console.error('initiateWorkspaceKhaltiPayment Error:', error);
        res.status(error?.status || 500).json({ message: error?.message || 'Server Error' });
    }
};

export const verifyWorkspaceKhaltiPayment = async (req, res) => {
    try {
        const workspace = req.workspace;
        if (!workspace) {
            return res.status(404).json({ message: 'Workspace not found' });
        }

        const { pidx } = req.body || {};
        if (!pidx) {
            return res.status(400).json({ message: 'pidx is required' });
        }

        const payment = await Payment.findOne({
            workspace: workspace._id,
            khaltiPidx: String(pidx),
        }).sort({ createdAt: -1 });

        if (!payment) {
            return res.status(404).json({ message: 'Payment record not found for this workspace' });
        }

        const lookupResponse = await lookupKhaltiPayment(String(pidx));
        const providerStatus = String(lookupResponse?.status || '');
        const mappedStatus = mapKhaltiStatusToPaymentStatus(providerStatus);

        const lookupAmount = Number(
            lookupResponse?.total_amount ?? lookupResponse?.amount ?? payment.amount
        );

        const purchaseOrderIdMatches = !lookupResponse?.purchase_order_id
            || String(lookupResponse.purchase_order_id) === String(payment.purchaseOrderId);
        const amountMatches = Number.isFinite(lookupAmount) && lookupAmount === Number(payment.amount);

        payment.providerResponse = {
            ...(payment.providerResponse || {}),
            lookupResponse,
        };

        if (mappedStatus === 'completed' && purchaseOrderIdMatches && amountMatches) {
            payment.status = 'completed';
            payment.paidAt = new Date();
            payment.khaltiTransactionId =
                lookupResponse?.transaction_id
                || lookupResponse?.tidx
                || payment.khaltiTransactionId;
            await payment.save();

            let subscription = await Subscription.findOne({ workspace: workspace._id }).sort({ createdAt: -1 });
            if (!subscription) {
                subscription = await Subscription.create({
                    workspace: workspace._id,
                    plan: WORKSPACE_PLAN.PRO,
                    status: 'active',
                    startDate: new Date(),
                });
            } else {
                subscription.plan = WORKSPACE_PLAN.PRO;
                subscription.status = 'active';
                subscription.startDate = new Date();
                subscription.endDate = undefined;
                await subscription.save();
            }

            workspace.settings = workspace.settings || {};
            workspace.settings.billing = workspace.settings.billing || {};
            workspace.settings.billing.currentPlan = WORKSPACE_PLAN.PRO;
            await workspace.save();

            return res.json({
                status: 'completed',
                message: 'Payment verified and Pro plan activated.',
                workspacePlan: WORKSPACE_PLAN.PRO,
                paymentId: payment._id,
            });
        }

        payment.status = mappedStatus;
        await payment.save();

        if (!purchaseOrderIdMatches || !amountMatches) {
            return res.status(400).json({
                status: 'failed',
                message: 'Payment verification failed due to mismatch.',
                details: {
                    purchaseOrderIdMatches,
                    amountMatches,
                },
            });
        }

        return res.status(400).json({
            status: mappedStatus,
            message: `Payment is ${providerStatus || mappedStatus}. Pro plan not activated.`,
        });
    } catch (error) {
        console.error('verifyWorkspaceKhaltiPayment Error:', error);
        res.status(error?.status || 500).json({
            message: error?.message || 'Failed to verify Khalti payment',
            providerResponse: error?.providerResponse || null,
        });
    }
};
