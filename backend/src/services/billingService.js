import Payment from '../models/Payment.js';
import Subscription from '../models/Subscription.js';
import { WORKSPACE_PLAN } from '../config/workspacePlans.js';
import { initiateKhaltiPayment, lookupKhaltiPayment } from './khaltiService.js';

const PRO_PLAN_PURCHASE_NAME = 'TaskMate Pro Workspace Upgrade';

/**
 * Read the PRO price (in paisa) from env.
 * Throws a 500 error if not configured correctly.
 */
export const getProAmountPaisa = () => {
    const raw = Number.parseInt(process.env.PRO_PRICE_PAISA, 10);
    if (!Number.isFinite(raw) || raw <= 0) {
        const err = new Error('PRO_PRICE_PAISA must be a positive integer');
        err.status = 500;
        throw err;
    }
    return raw;
};

/**
 * Build the frontend billing-result URL with workspaceId injected.
 */
export const buildBillingResultUrl = (workspaceId) => {
    const frontendUrl = String(process.env.FRONTEND_URL || '').trim();
    if (!frontendUrl) {
        const err = new Error('FRONTEND_URL is not configured');
        err.status = 500;
        throw err;
    }
    const resultUrl = new URL('/billing/result', frontendUrl);
    resultUrl.searchParams.set('workspaceId', String(workspaceId || ''));
    return resultUrl.toString();
};

/**
 * Map a raw Khalti status string to our internal Payment status.
 */
export const mapKhaltiStatusToPaymentStatus = (status) => {
    const normalized = String(status || '').trim().toLowerCase();
    if (normalized === 'completed') return 'completed';
    if (normalized.includes('cancel')) return 'cancelled';
    if (normalized.includes('refund')) return 'refunded';
    if (normalized.includes('fail')) return 'failed';
    if (normalized.includes('pending') || normalized.includes('initiated')) return 'pending';
    return 'failed';
};

/**
 * Generate a unique purchase order ID for a workspace payment.
 */
export const generatePurchaseOrderId = (workspaceId) =>
    `tm_${workspaceId}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

/**
 * Validate that the Khalti lookup response matches our stored payment record.
 * Returns { purchaseOrderIdMatches, amountMatches, lookupAmount }.
 */
export const validatePaymentLookup = (payment, lookupResponse) => {
    const lookupAmount = Number(
        lookupResponse?.total_amount ?? lookupResponse?.amount ?? payment.amount
    );
    const purchaseOrderIdMatches =
        !lookupResponse?.purchase_order_id ||
        String(lookupResponse.purchase_order_id) === String(payment.purchaseOrderId);
    const amountMatches =
        Number.isFinite(lookupAmount) && lookupAmount === Number(payment.amount);
    return { purchaseOrderIdMatches, amountMatches, lookupAmount };
};

/**
 * Activate the Pro plan for a workspace:
 *  - marks payment as completed
 *  - upserts the Subscription record
 *  - updates workspace.settings.billing.currentPlan = PRO
 */
export const activateProPlan = async (workspace, payment, lookupResponse) => {
    payment.status = 'completed';
    payment.paidAt = new Date();
    payment.khaltiTransactionId =
        lookupResponse?.transaction_id ||
        lookupResponse?.tidx ||
        payment.khaltiTransactionId;
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
};

/**
 * Full initiate-payment flow:
 *  1. Guard: already Pro?
 *  2. Create a pending Payment record
 *  3. Call Khalti to get a payment URL
 *  4. Store khaltiPidx on the payment
 *  Returns { paymentUrl, pidx, purchaseOrderId, amount }.
 */
export const initiateProPayment = async ({ workspace, user }) => {
    if (workspace?.settings?.billing?.currentPlan === WORKSPACE_PLAN.PRO) {
        const err = new Error('This workspace is already on Pro plan');
        err.status = 400;
        throw err;
    }

    const amount = getProAmountPaisa();
    const purchaseOrderId = generatePurchaseOrderId(workspace._id);
    const returnUrl = buildBillingResultUrl(workspace._id);
    const websiteUrl = String(process.env.FRONTEND_URL || '').trim();

    const payment = await Payment.create({
        workspace: workspace._id,
        user: user._id,
        plan: WORKSPACE_PLAN.PRO,
        amount,
        paymentMethod: 'khalti',
        purchaseOrderId,
        status: 'pending',
        providerResponse: { initiatedAt: new Date().toISOString() },
    });

    try {
        const khaltiResponse = await initiateKhaltiPayment({
            return_url: returnUrl,
            website_url: websiteUrl,
            amount,
            purchase_order_id: purchaseOrderId,
            purchase_order_name: PRO_PLAN_PURCHASE_NAME,
            customer_info: {
                name: user?.fullname || 'TaskMate User',
                email: user?.email || '',
            },
        });

        payment.khaltiPidx = khaltiResponse?.pidx || '';
        payment.providerResponse = {
            ...(payment.providerResponse || {}),
            initiateResponse: khaltiResponse,
        };
        await payment.save();

        return {
            paymentUrl: khaltiResponse?.payment_url,
            pidx: khaltiResponse?.pidx,
            purchaseOrderId,
            amount,
        };
    } catch (providerError) {
        payment.status = 'failed';
        payment.providerResponse = {
            ...(payment.providerResponse || {}),
            initiateError:
                providerError?.providerResponse ||
                providerError?.message ||
                'Khalti initiate failed',
        };
        await payment.save();
        throw providerError;
    }
};

/**
 * Full verify-payment flow:
 *  1. Find the pending Payment by pidx
 *  2. Call Khalti lookup
 *  3. Validate amount + orderId
 *  4. On success: activate Pro plan
 *  Returns a result object describing the outcome.
 */
export const verifyProPayment = async ({ workspace, pidx }) => {
    const payment = await Payment.findOne({
        workspace: workspace._id,
        khaltiPidx: String(pidx),
    }).sort({ createdAt: -1 });

    if (!payment) {
        const err = new Error('Payment record not found for this workspace');
        err.status = 404;
        throw err;
    }

    const lookupResponse = await lookupKhaltiPayment(String(pidx));
    const providerStatus = String(lookupResponse?.status || '');
    const mappedStatus = mapKhaltiStatusToPaymentStatus(providerStatus);

    payment.providerResponse = {
        ...(payment.providerResponse || {}),
        lookupResponse,
    };

    const { purchaseOrderIdMatches, amountMatches } = validatePaymentLookup(payment, lookupResponse);

    if (mappedStatus === 'completed' && purchaseOrderIdMatches && amountMatches) {
        await activateProPlan(workspace, payment, lookupResponse);
        return {
            status: 'completed',
            message: 'Payment verified and Pro plan activated.',
            workspacePlan: WORKSPACE_PLAN.PRO,
            paymentId: payment._id,
        };
    }

    payment.status = mappedStatus;
    await payment.save();

    if (!purchaseOrderIdMatches || !amountMatches) {
        const err = new Error('Payment verification failed due to mismatch.');
        err.status = 400;
        err.details = { purchaseOrderIdMatches, amountMatches };
        err.verifyStatus = 'failed';
        throw err;
    }

    return {
        status: mappedStatus,
        message: `Payment is ${providerStatus || mappedStatus}. Pro plan not activated.`,
        httpStatus: 400,
    };
};
