import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../api';
import { toast } from 'react-hot-toast';
import { CheckCircle2, XCircle } from 'lucide-react';
import useWorkspaceStore from '../store/useWorkspaceStore';
import Loader from '../components/common/Loader';

const verifyResultCache = new Map();
const verifyToastSent = new Set();

const BillingResult = () => {
    const [searchParams] = useSearchParams();
    const {
        currentWorkspaceId,
        setCurrentWorkspaceId,
        selectedWorkspace,
        setSelectedWorkspace,
    } = useWorkspaceStore();

    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState('pending');
    const [message, setMessage] = useState('Verifying payment with Khalti...');

    const workspaceId = useMemo(
        () => String(searchParams.get('workspaceId') || currentWorkspaceId || ''),
        [searchParams, currentWorkspaceId]
    );
    const pidx = useMemo(() => String(searchParams.get('pidx') || ''), [searchParams]);
    const verifyCacheKey = useMemo(() => `${workspaceId}:${pidx}`, [workspaceId, pidx]);

    const refreshWorkspaceContext = useCallback(async () => {
        if (!workspaceId) return;
        const res = await api.get(`/api/workspaces/${workspaceId}`);
        const payload = res?.data;
        if (!payload?.workspace) return;

        setSelectedWorkspace(payload);
        setCurrentWorkspaceId(workspaceId);
    }, [workspaceId, setSelectedWorkspace, setCurrentWorkspaceId]);

    useEffect(() => {
        let cancelled = false;

        const verifyPayment = async () => {
            if (!workspaceId || !pidx) {
                if (cancelled) return;
                setStatus('failed');
                setMessage('Missing billing response parameters. Please try the payment again.');
                setLoading(false);
                return;
            }

            try {
                let verifyPromise = verifyResultCache.get(verifyCacheKey);
                if (!verifyPromise) {
                    verifyPromise = axios
                        .post(`/api/workspaces/${workspaceId}/billing/khalti/verify`, { pidx })
                        .then((res) => ({
                            status: res?.data?.status === 'completed' ? 'completed' : 'failed',
                            message:
                                res?.data?.status === 'completed'
                                    ? res?.data?.message || 'Payment completed and Pro plan activated.'
                                    : res?.data?.message || 'Payment was not completed.',
                        }))
                        .catch((err) => ({
                            status: 'failed',
                            message: err?.response?.data?.message || 'Failed to verify payment.',
                        }));

                    verifyResultCache.set(verifyCacheKey, verifyPromise);
                }

                const result = await verifyPromise;
                if (cancelled) return;

                setStatus(result.status);
                setMessage(result.message);

                if (result.status === 'completed') {
                    await refreshWorkspaceContext();
                    if (!verifyToastSent.has(verifyCacheKey)) {
                        toast.success('Workspace upgraded to Pro');
                        verifyToastSent.add(verifyCacheKey);
                    }
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        verifyPayment();

        return () => {
            cancelled = true;
        };
    }, [workspaceId, pidx, verifyCacheKey, refreshWorkspaceContext]);

    return (
        <div className="px-8 py-10">
            <div className="max-w-xl mx-auto rounded-2xl border border-gray-200 bg-white p-6 shadow-xs">
                <h1 className="text-xl font-bold text-gray-900">Billing Result</h1>
                <p className="mt-1 text-sm text-gray-500">
                    Workspace: {selectedWorkspace?.workspace?.name || workspaceId || 'Unknown'}
                </p>

                <div className="mt-5 rounded-xl border border-gray-100 bg-gray-50 p-4">
                    {loading && (
                        <div className="flex flex-col items-center gap-3 text-sm text-gray-700">
                            <Loader />
                            <span>{message}</span>
                        </div>
                    )}

                    {!loading && status === 'completed' && (
                        <div className="flex items-start gap-2 text-sm text-emerald-700">
                            <CheckCircle2 className="w-4 h-4 mt-0.5" />
                            {message}
                        </div>
                    )}

                    {!loading && status !== 'completed' && (
                        <div className="flex items-start gap-2 text-sm text-red-700">
                            <XCircle className="w-4 h-4 mt-0.5" />
                            {message}
                        </div>
                    )}
                </div>

                <div className="mt-5 flex items-center gap-3">
                    <Link
                        to="/settings"
                        className="inline-flex px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition"
                    >
                        Back to Billing
                    </Link>
                    <Link
                        to="/dashboard"
                        className="inline-flex px-4 py-2 rounded-lg border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
                    >
                        Go to Dashboard
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default BillingResult;
