import { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import useAuthStore from '../store/useAuthStore';
import useWorkspaceStore from '../store/useWorkspaceStore';
import InviteUserModal from '../components/InviteUserModal';

const WorkspaceMembers = () => {
    const { userInfo } = useAuthStore();
    const { currentWorkspaceId, selectedWorkspace, setSelectedWorkspace } = useWorkspaceStore();
    const [loading, setLoading] = useState(true);
    const [showInviteModal, setShowInviteModal] = useState(false);

    const refreshWorkspace = async () => {
        if (!currentWorkspaceId) return;
        setLoading(true);
        try {
            const res = await axios.get(`/api/workspaces/${currentWorkspaceId}`);
            setSelectedWorkspace(res.data);
        } catch (err) {
            console.error('Failed to load workspace members', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refreshWorkspace();
    }, [currentWorkspaceId]);

    if (!currentWorkspaceId) {
        return (
            <div className="px-8 py-10">
                <div className="text-center text-gray-500">Select a workspace to view members.</div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="px-8 py-10">
                <div className="text-gray-500">Loading members...</div>
            </div>
        );
    }

    const workspace = selectedWorkspace?.workspace;
    const myRole = workspace?.members?.find(m => m.user._id === userInfo._id)?.role;
    const isOwner = myRole === 'owner';
    const canInvite = myRole === 'owner' || myRole === 'admin';

    const handleRoleChange = async (userId, newRole) => {
        try {
            await axios.put(`/api/workspaces/${workspace._id}/role`, { memberId: userId, newRole });
            toast.success('Role updated');
            refreshWorkspace();
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Failed to update role');
        }
    };

    const handleKick = async (userId) => {
        if (!confirm('Are you sure you want to remove this user?')) return;
        try {
            await axios.delete(`/api/workspaces/${workspace._id}/members/${userId}`);
            toast.success('Member removed');
            refreshWorkspace();
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Failed to remove user');
        }
    };

    return (
        <div className="px-8 py-10">
            <div className="mb-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Members</h1>
                        <p className="text-gray-500 text-sm">Manage roles and access for this workspace.</p>
                    </div>
                    {canInvite && (
                        <button
                            onClick={() => setShowInviteModal(true)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition"
                        >
                            Invite Member
                        </button>
                    )}
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 space-y-3">
                {workspace?.members?.map((member) => (
                    <div key={member.user._id} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm">
                                {member.user.fullname.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                                <p className="text-sm font-semibold">{member.user.fullname}</p>
                                <p className="text-xs text-gray-500">{member.user.email}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <span className={`text-xs px-3 py-1.5 rounded-lg capitalize font-medium
                                ${member.role === 'owner' ? 'bg-purple-100 text-purple-700 border border-purple-200' : 
                                  member.role === 'admin' ? 'bg-orange-100 text-orange-700 border border-orange-200' : 'bg-gray-200 text-gray-700 border border-gray-300'}`}>
                                {member.role}
                            </span>

                            {isOwner && member.role !== 'owner' && (
                                <>
                                    <select
                                        className="text-xs border-2 border-gray-200 rounded-lg p-1.5"
                                        value={member.role}
                                        onChange={(e) => handleRoleChange(member.user._id, e.target.value)}
                                    >
                                        <option value="admin">Admin</option>
                                        <option value="member">Member</option>
                                    </select>
                                    <button
                                        onClick={() => handleKick(member.user._id)}
                                        className="text-red-500 hover:text-red-700 text-xs font-semibold"
                                    >
                                        Remove
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {showInviteModal && (
                <InviteUserModal
                    isOpen={showInviteModal}
                    onClose={() => {
                        setShowInviteModal(false);
                        refreshWorkspace();
                    }}
                    workspaceId={workspace?._id}
                />
            )}
        </div>
    );
};

export default WorkspaceMembers;
