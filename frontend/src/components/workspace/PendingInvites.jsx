import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Mail, Check, X, Clock, Users, Calendar } from 'lucide-react';
import { inviteAPI } from '../../api/invites';

const PendingInvites = () => {
    const [invites, setInvites] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState(null);

    useEffect(() => {
        fetchInvites();
    }, []);

    const fetchInvites = async () => {
        try {
            const res = await inviteAPI.getMyInvites();
            setInvites(res.data);
        } catch (err) {
            console.error('Failed to fetch invites:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleAccept = async (inviteId) => {
        setProcessingId(inviteId);
        try {
            const res = await inviteAPI.acceptInvite(inviteId);
            toast.success(res.data.message);
            setInvites(invites.filter(inv => inv._id !== inviteId));
            // Optionally reload workspaces or redirect
            window.location.reload(); // Simple approach - reload to show new workspace
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Failed to accept invite');
        } finally {
            setProcessingId(null);
        }
    };

    const handleDecline = async (inviteId) => {
        setProcessingId(inviteId);
        try {
            const res = await inviteAPI.declineInvite(inviteId);
            toast.success(res.data.message);
            setInvites(invites.filter(inv => inv._id !== inviteId));
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Failed to decline invite');
        } finally {
            setProcessingId(null);
        }
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (invites.length === 0) {
        return (
            <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Mail className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Pending Invites</h3>
                <p className="text-sm text-gray-500">You don't have any workspace invitations at the moment.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Workspace Invitations</h2>
                    <p className="text-sm text-gray-500 mt-1">{invites.length} pending {invites.length === 1 ? 'invite' : 'invites'}</p>
                </div>
            </div>

            <div className="space-y-3">
                {invites.map((invite) => (
                    <div
                        key={invite._id}
                        className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition"
                    >
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-12 h-12 rounded-xl bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                                        {invite.workspace?.name?.[0]?.toUpperCase() || 'W'}
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900">
                                            {invite.workspace?.name}
                                        </h3>
                                        <p className="text-sm text-gray-500">
                                            Invited by {invite.invitedBy?.fullname || 'Unknown'}
                                        </p>
                                    </div>
                                </div>

                                {invite.workspace?.description && (
                                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                                        {invite.workspace.description}
                                    </p>
                                )}

                                <div className="flex items-center gap-4 text-xs text-gray-500">
                                    <span className="inline-flex items-center gap-1">
                                        <Users className="w-3.5 h-3.5" />
                                        Role: <span className="font-medium capitalize">{invite.role}</span>
                                    </span>
                                    <span className="inline-flex items-center gap-1">
                                        <Calendar className="w-3.5 h-3.5" />
                                        Sent {formatDate(invite.createdAt)}
                                    </span>
                                    <span className="inline-flex items-center gap-1">
                                        <Clock className="w-3.5 h-3.5" />
                                        Expires {formatDate(invite.expiresAt)}
                                    </span>
                                </div>
                            </div>

                            <div className="flex flex-col gap-2 shrink-0">
                                <button
                                    onClick={() => handleAccept(invite._id)}
                                    disabled={processingId === invite._id}
                                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium text-sm inline-flex items-center gap-2"
                                >
                                    <Check className="w-4 h-4" />
                                    Accept
                                </button>
                                <button
                                    onClick={() => handleDecline(invite._id)}
                                    disabled={processingId === invite._id}
                                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium text-sm inline-flex items-center gap-2"
                                >
                                    <X className="w-4 h-4" />
                                    Decline
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default PendingInvites;
