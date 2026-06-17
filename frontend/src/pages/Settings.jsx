import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';
import { toast } from 'react-hot-toast';
import {
    ArrowLeftRight,
    CreditCard,
    ShieldAlert,
    CheckCircle2,
    Sparkles,
} from 'lucide-react';
import useWorkspaceStore from '../store/useWorkspaceStore';
import useAuthStore from '../store/useAuthStore';
import ConfirmModal from '../components/modals/ConfirmModal';
import { WORKSPACE_PLAN, WORKSPACE_PLAN_FEATURES, normalizeWorkspacePlan } from '../constants/workspacePlans';

const COLOR_OPTIONS = ['#F97316', '#22C55E', '#FACC15', '#14B8A6', '#A855F7', '#22D3EE', '#60A5FA', '#0F172A'];

const resolveMemberId = (member) => String(member?.user?._id || member?.user || '');

const Settings = () => {
    const navigate = useNavigate();
    const {
        workspaces,
        setWorkspaces,
        currentWorkspaceId,
        selectedWorkspace,
        setSelectedWorkspace,
        setCurrentWorkspaceId,
    } = useWorkspaceStore();
    const { userInfo } = useAuthStore();

    const workspace = selectedWorkspace?.workspace;
    const members = useMemo(() => workspace?.members || [], [workspace?.members]);
    const myRole = members.find((m) => resolveMemberId(m) === String(userInfo?._id || ''))?.role;
    const isOwner = myRole === 'owner';

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [color, setColor] = useState('#F97316');
    const [transferTargetId, setTransferTargetId] = useState('');
    const [loading, setLoading] = useState(false);
    const [showDeleteWorkspaceConfirm, setShowDeleteWorkspaceConfirm] = useState(false);
    const [deletingWorkspace, setDeletingWorkspace] = useState(false);
    const [showTransferConfirm, setShowTransferConfirm] = useState(false);
    const [transferringOwnership, setTransferringOwnership] = useState(false);
    const [upgradingPlan, setUpgradingPlan] = useState(false);

    const applyWorkspaceToForm = useCallback(() => {
        if (!workspace) return;

        setName(workspace.name || '');
        setDescription(workspace.description || '');
        setColor(workspace.color || '#F97316');
        setTransferTargetId('');
    }, [workspace]);

    useEffect(() => {
        applyWorkspaceToForm();
    }, [applyWorkspaceToForm]);

    const projectCount = Array.isArray(selectedWorkspace?.projects) ? selectedWorkspace.projects.length : 0;
    const memberCount = members.length;
    const ownerName = members.find((member) => member.role === 'owner')?.user?.fullname || 'Unknown';
    const createdAtLabel = workspace?.createdAt
        ? new Date(workspace.createdAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        })
        : '-';
    const currentPlan = normalizeWorkspacePlan(workspace?.settings?.billing?.currentPlan);
    const isProPlan = currentPlan === WORKSPACE_PLAN.PRO;
    const planFeatures = WORKSPACE_PLAN_FEATURES[currentPlan] || WORKSPACE_PLAN_FEATURES[WORKSPACE_PLAN.FREE];

    const transferCandidates = useMemo(
        () => members.filter((member) => resolveMemberId(member) !== String(userInfo?._id || '') && member.role !== 'owner'),
        [members, userInfo?._id]
    );
    const selectedTransferMember = transferCandidates.find(
        (member) => resolveMemberId(member) === String(transferTargetId || '')
    );

    const patchWorkspaceState = useCallback((nextWorkspace) => {
        if (!nextWorkspace) return;

        const mergedWorkspace = {
            ...(selectedWorkspace?.workspace || {}),
            ...nextWorkspace,
            members:
                Array.isArray(nextWorkspace?.members) && nextWorkspace.members.length > 0
                    ? nextWorkspace.members
                    : selectedWorkspace?.workspace?.members || [],
        };

        setSelectedWorkspace({
            workspace: mergedWorkspace,
            projects: selectedWorkspace?.projects || [],
            channels: selectedWorkspace?.channels || [],
        });

        if (Array.isArray(workspaces) && typeof setWorkspaces === 'function') {
            setWorkspaces(
                workspaces.map((item) =>
                    String(item?._id) === String(mergedWorkspace?._id)
                        ? { ...item, ...mergedWorkspace }
                        : item
                )
            );
        }
    }, [selectedWorkspace, setSelectedWorkspace, setWorkspaces, workspaces]);

    const handleSave = async (event) => {
        event.preventDefault();
        if (!currentWorkspaceId || !isOwner) return;

        const trimmedName = name.trim();
        if (!trimmedName) {
            toast.error('Workspace name is required');
            return;
        }

        setLoading(true);
        try {
            const res = await api.put(`/api/workspaces/${currentWorkspaceId}`, {
                name: trimmedName,
                description: description.trim(),
                color,
            });

            patchWorkspaceState(res.data);
            toast.success('Workspace settings updated');
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Failed to update workspace settings');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = () => {
        if (!currentWorkspaceId || !isOwner) return;
        setShowDeleteWorkspaceConfirm(true);
    };

    const confirmDeleteWorkspace = async () => {
        if (!currentWorkspaceId || !isOwner) return;
        setDeletingWorkspace(true);
        try {
            await api.delete(`/api/workspaces/${currentWorkspaceId}`);
            toast.success('Workspace deleted');
            setShowDeleteWorkspaceConfirm(false);
            setCurrentWorkspaceId(null);
            setSelectedWorkspace(null);
            window.location.assign('/dashboard');
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Failed to delete workspace');
        } finally {
            setDeletingWorkspace(false);
        }
    };

    const openTransferConfirm = () => {
        if (!transferTargetId) {
            toast.error('Select a member to transfer ownership');
            return;
        }
        setShowTransferConfirm(true);
    };

    const confirmTransferOwnership = async () => {
        if (!currentWorkspaceId || !transferTargetId || !isOwner) return;

        setTransferringOwnership(true);
        try {
            const res = await api.post(`/api/workspaces/${currentWorkspaceId}/transfer-ownership`, {
                newOwnerId: transferTargetId,
            });
            patchWorkspaceState(res.data?.workspace);
            setShowTransferConfirm(false);
            setTransferTargetId('');
            toast.success('Ownership transferred');
            navigate('/dashboard');
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Failed to transfer ownership');
        } finally {
            setTransferringOwnership(false);
        }
    };

    const handleUpgradeToProWithKhalti = async () => {
        if (!currentWorkspaceId || !isOwner) return;
        if (isProPlan) {
            toast('This workspace is already on Pro plan.');
            return;
        }

        setUpgradingPlan(true);
        try {
            const res = await api.post(`/api/workspaces/${currentWorkspaceId}/billing/khalti/initiate`);
            const paymentUrl = res?.data?.paymentUrl;
            if (!paymentUrl) {
                throw new Error('Khalti payment URL was not returned');
            }
            window.location.assign(paymentUrl);
        } catch (err) {
            toast.error(err?.response?.data?.message || err?.message || 'Failed to start Khalti payment');
            setUpgradingPlan(false);
        }
    };

    if (!currentWorkspaceId) {
        return (
            <div className="px-8 py-10">
                <div className="text-center text-gray-500">Select a workspace to manage settings.</div>
            </div>
        );
    }

    if (!isOwner) {
        return (
            <div className="px-8 py-10">
                <div className="max-w-xl mx-auto rounded-2xl border border-amber-200 bg-amber-50 p-6">
                    <div className="flex items-center gap-3 text-amber-700">
                        <ShieldAlert className="w-5 h-5 shrink-0" />
                        <h2 className="text-base font-semibold">Access denied</h2>
                    </div>
                    <p className="mt-2 text-sm text-amber-700">
                        Only the workspace owner can access Workspace Settings.
                    </p>
                    <Link
                        to="/dashboard"
                        className="inline-flex mt-4 px-4 py-2 rounded-lg bg-amber-600 text-white text-sm font-semibold hover:bg-amber-700 transition"
                    >
                        Back to dashboard
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="px-8 py-8">
            <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Workspace Settings</h1>
                    <p className="text-gray-500 mt-1 text-sm">Manage workspace configuration and security.</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={applyWorkspaceToForm}
                        disabled={loading}
                        className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={loading}
                        className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60"
                    >
                        {loading ? 'Saving...' : 'Save changes'}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px] gap-6 items-start">
                <form onSubmit={handleSave} className="space-y-5">
                    <section className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs">
                        <h2 className="text-lg font-semibold text-gray-900">Workspace Profile</h2>
                        <p className="text-sm text-gray-500 mt-1">Basic identity and visual style.</p>

                        <div className="mt-5 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Workspace Name</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(event) => setName(event.target.value)}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <textarea
                                    value={description}
                                    onChange={(event) => setDescription(event.target.value)}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent h-24 resize-none"
                                    placeholder="Describe this workspace"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Workspace Color</label>
                                <div className="flex items-center gap-3 flex-wrap">
                                    {COLOR_OPTIONS.map((hexColor) => {
                                        const isActive = hexColor === color;
                                        return (
                                            <button
                                                type="button"
                                                key={hexColor}
                                                onClick={() => setColor(hexColor)}
                                                className={`w-9 h-9 rounded-full border-2 flex items-center justify-center transition ${
                                                    isActive
                                                        ? 'border-indigo-500 scale-110 shadow-md'
                                                        : 'border-transparent hover:border-gray-300'
                                                }`}
                                                aria-label={`Select workspace color ${hexColor}`}
                                            >
                                                <span className="w-6 h-6 rounded-full" style={{ backgroundColor: hexColor }} />
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900">Billing & Plan</h2>
                                <p className="text-sm text-gray-500 mt-1">Subscription overview and upgrade path.</p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                isProPlan
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : 'bg-gray-100 text-gray-700'
                            }`}>
                                {isProPlan ? 'Pro' : 'Free'}
                            </span>
                        </div>

                        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Current Plan */}
                            <div className={`border rounded-xl p-4 ${isProPlan ? 'border-indigo-200 bg-indigo-50/50' : 'border-gray-200 bg-gray-50/50'}`}>
                                <div className="flex items-center gap-2 mb-3">
                                    <CreditCard className="w-4 h-4 text-gray-500" />
                                    <p className="text-sm font-semibold text-gray-900">Current Plan: {isProPlan ? 'Pro' : 'Free'}</p>
                                </div>
                                <ul className="space-y-1.5 text-xs text-gray-600">
                                    <li className="flex items-center gap-2">
                                        <CheckCircle2 className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                        {planFeatures.maxProjects === null ? 'Unlimited projects' : `Up to ${planFeatures.maxProjects} projects`}
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <CheckCircle2 className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                        {planFeatures.maxMembers === null ? 'Unlimited members' : `Up to ${planFeatures.maxMembers} members`}
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <CheckCircle2 className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                        Analytics {planFeatures.analyticsEnabled ? 'enabled' : 'disabled'}
                                    </li>
                                </ul>
                            </div>

                            {/* Pro Plan Upgrade */}
                            {!isProPlan && (
                                <div className="border-2 border-indigo-200 bg-linear-to-br from-indigo-50 to-white rounded-xl p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <p className="text-sm font-semibold text-gray-900">Pro Plan</p>
                                    </div>
                                    <p className="text-xl font-bold text-gray-900 mb-3">Rs. 10<span className="text-xs font-normal text-gray-500"> / workspace</span></p>
                                    <ul className="space-y-1.5 text-xs text-gray-600 mb-4">
                                        <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />Unlimited projects</li>
                                        <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />Unlimited members</li>
                                        <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />Analytics enabled</li>
                                    </ul>
                                    <button
                                        type="button"
                                        onClick={handleUpgradeToProWithKhalti}
                                        disabled={upgradingPlan}
                                        className="w-full px-4 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition disabled:opacity-60 shadow-md shadow-indigo-200"
                                    >
                                        {upgradingPlan ? 'Processing...' : 'Upgrade to Pro'}
                                    </button>
                                </div>
                            )}
                        </div>
                    </section>

                    <section className="bg-white border border-red-200 rounded-2xl p-6 shadow-xs">
                        <h2 className="text-lg font-semibold text-red-700">Danger Zone</h2>
                        <p className="text-sm text-red-500 mt-1">High-impact actions. Proceed carefully.</p>

                        <div className="mt-5 space-y-3">
                            <div className="flex flex-col md:flex-row md:items-end gap-3 p-4 rounded-xl border border-red-100 bg-red-50">
                                <div className="flex-1">
                                    <label className="block text-sm font-semibold text-red-700 mb-1">Transfer Ownership</label>
                                    <select
                                        value={transferTargetId}
                                        onChange={(event) => setTransferTargetId(event.target.value)}
                                        className="w-full px-3 py-2 border border-red-200 rounded-lg bg-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                    >
                                        <option value="">Select member</option>
                                        {transferCandidates.map((member) => (
                                            <option key={resolveMemberId(member)} value={resolveMemberId(member)}>
                                                {member?.user?.fullname || 'User'} ({member?.role || 'member'})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <button
                                    type="button"
                                    onClick={openTransferConfirm}
                                    disabled={!transferTargetId}
                                    className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-red-300 text-red-700 font-semibold hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <ArrowLeftRight className="w-4 h-4" />
                                    Transfer
                                </button>
                            </div>

                            <div className="flex items-center justify-between p-4 rounded-xl border border-red-100 bg-red-50">
                                <div>
                                    <p className="text-sm font-semibold text-red-700">Delete Workspace</p>
                                    <p className="text-xs text-red-500 mt-1">Type the workspace name in confirmation to delete permanently.</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleDelete}
                                    className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </section>
                </form>

                <aside className="space-y-5 xl:sticky xl:top-6">
                    <section className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs">
                        <h3 className="text-sm font-semibold text-gray-900">Workspace Summary</h3>
                        <div className="mt-3 space-y-3 text-sm">
                            <div className="flex items-center justify-between">
                                <span className="text-gray-500">Workspace</span>
                                <span className="font-medium text-gray-900 truncate max-w-[170px] text-right">{workspace?.name || '-'}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-gray-500">Owner</span>
                                <span className="font-medium text-gray-900 truncate max-w-[170px] text-right">{ownerName}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-gray-500">Members</span>
                                <span className="font-medium text-gray-900">{memberCount}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-gray-500">Projects</span>
                                <span className="font-medium text-gray-900">{projectCount}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-gray-500">Created</span>
                                <span className="font-medium text-gray-900">{createdAtLabel}</span>
                            </div>
                        </div>
                    </section>


                    <section className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs">
                        <h3 className="text-sm font-semibold text-gray-900">Tips</h3>
                        <ul className="mt-3 space-y-2 text-xs text-gray-500">
                            <li>Only the owner can access this page.</li>
                            <li>Transfer ownership before deleting workspace.</li>
                            <li>Pending invites expire in 72 hours.</li>
                        </ul>
                    </section>
                </aside>
            </div>

            <ConfirmModal
                isOpen={showDeleteWorkspaceConfirm}
                title="Delete Workspace"
                message="This action cannot be undone."
                confirmText="Delete Workspace"
                cancelText="Cancel"
                variant="danger"
                requireText={workspace?.name || ''}
                loading={deletingWorkspace}
                onClose={() => !deletingWorkspace && setShowDeleteWorkspaceConfirm(false)}
                onConfirm={confirmDeleteWorkspace}
            />

            <ConfirmModal
                isOpen={showTransferConfirm}
                title="Transfer Ownership"
                message={`Transfer ownership to ${selectedTransferMember?.user?.fullname || 'selected member'}? You will become an admin.`}
                confirmText="Transfer Ownership"
                cancelText="Cancel"
                variant="primary"
                loading={transferringOwnership}
                onClose={() => !transferringOwnership && setShowTransferConfirm(false)}
                onConfirm={confirmTransferOwnership}
            />
        </div>
    );
};

export default Settings;
