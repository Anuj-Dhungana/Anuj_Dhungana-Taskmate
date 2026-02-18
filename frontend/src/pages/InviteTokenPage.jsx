import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Mail, CheckCircle, XCircle, Loader2, ArrowRight } from 'lucide-react';
import { inviteAPI } from '../api/invites';
import useAuthStore from '../store/useAuthStore';

const InviteTokenPage = () => {
    const { token } = useParams();
    const navigate = useNavigate();
    const { userInfo } = useAuthStore();
    const [invite, setInvite] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [accepting, setAccepting] = useState(false);

    useEffect(() => {
        verifyToken();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token]);

    useEffect(() => {
        // If user is logged in and invite is valid, auto-accept
        if (userInfo && invite && !accepting) {
            handleAcceptInvite();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userInfo, invite]);

    const verifyToken = async () => {
        try {
            const res = await inviteAPI.verifyInviteToken(token);
            setInvite(res.data.invite);
        } catch (err) {
            setError(err.response?.data?.message || 'Invalid or expired invite link');
        } finally {
            setLoading(false);
        }
    };

    const handleAcceptInvite = async () => {
        setAccepting(true);
        try {
            await inviteAPI.acceptInviteByToken(token);
            navigate(`/workspaces/${invite.workspace._id}`, {
                state: { message: 'Successfully joined workspace!' }
            });
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to accept invite');
            setAccepting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-linear-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
                    <p className="text-gray-600">Verifying invitation...</p>
                </div>
            </div>
        );
    }

    if (error || !invite) {
        return (
            <div className="min-h-screen bg-linear-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <XCircle className="w-8 h-8 text-red-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Invalid Invitation</h1>
                    <p className="text-gray-600 mb-6">{error}</p>
                    <Link
                        to="/login"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                        Go to Login
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
            </div>
        );
    }

    if (accepting) {
        return (
            <div className="min-h-screen bg-linear-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
                    <p className="text-gray-600">Accepting invitation...</p>
                </div>
            </div>
        );
    }

    // User is not logged in, show workspace details and prompt to login/register
    if (!userInfo) {
        return (
            <div className="min-h-screen bg-linear-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
                    <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Mail className="w-8 h-8 text-indigo-600" />
                    </div>
                    
                    <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">
                        You're Invited!
                    </h1>
                    
                    <p className="text-gray-600 text-center mb-6">
                        {invite.invitedBy?.name || 'A team member'} has invited you to join
                    </p>

                    <div className="bg-indigo-50 rounded-lg p-4 mb-6">
                        <div className="flex items-center gap-3 mb-2">
                            {invite.workspace?.icon && (
                                <div className="text-2xl">{invite.workspace.icon}</div>
                            )}
                            <div>
                                <h2 className="font-semibold text-gray-900">{invite.workspace?.name}</h2>
                                <p className="text-sm text-gray-600">
                                    as {invite.role === 'admin' ? 'Admin' : 'Member'}
                                </p>
                            </div>
                        </div>
                        {invite.workspace?.description && (
                            <p className="text-sm text-gray-600 mt-2">{invite.workspace.description}</p>
                        )}
                    </div>

                    <div className="space-y-3">
                        <Link
                            to={`/login?inviteToken=${token}`}
                            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                        >
                            Login to Accept
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                        
                        <Link
                            to={`/register?inviteToken=${token}&email=${encodeURIComponent(invite.email)}`}
                            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                            Create Account
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>

                    <p className="text-xs text-gray-500 text-center mt-6">
                        This invitation expires on {new Date(invite.expiresAt).toLocaleDateString()}
                    </p>
                </div>
            </div>
        );
    }

    return null;
};

export default InviteTokenPage;
