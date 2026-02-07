import { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { X, Shield, Trash2, User } from 'lucide-react';
import useAuthStore from '../../store/useAuthStore';
import ConfirmModal from './ConfirmModal';

const MembersModal = ({ isOpen, onClose, workspace, onUpdate }) => {
    const { userInfo } = useAuthStore();
    const [memberToRemove, setMemberToRemove] = useState(null);
    const [removingMember, setRemovingMember] = useState(false);
    const [showDeleteWorkspaceConfirm, setShowDeleteWorkspaceConfirm] = useState(false);
    const [deletingWorkspace, setDeletingWorkspace] = useState(false);
    
    // Find MY role
    const myRole = workspace?.members.find(m => m.user._id === userInfo._id)?.role;
    const isOwner = myRole === 'owner';
    const isAdmin = myRole === 'admin';

    if (!isOpen || !workspace) return null;

    const handleRoleChange = async (userId, newRole) => {
        try {
            await axios.put(`/api/workspaces/${workspace._id}/role`, { 
                memberId: userId, 
                newRole 
            });
            toast.success('Role updated');
            onUpdate(); // Refresh data
        } catch {
            toast.error('Failed to update role');
        }
    };

    const handleKick = (userId, fullname) => {
        setMemberToRemove({ userId, fullname });
    };

    const confirmKick = async () => {
        if (!memberToRemove?.userId) return;
        setRemovingMember(true);
        try {
            await axios.delete(`/api/workspaces/${workspace._id}/members/${memberToRemove.userId}`);
            toast.success('Member removed');
            setMemberToRemove(null);
            onUpdate();
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Failed to remove');
        } finally {
            setRemovingMember(false);
        }
    };

    const handleDeleteWorkspace = async () => {
        setShowDeleteWorkspaceConfirm(true);
    };

    const confirmDeleteWorkspace = async () => {
        setDeletingWorkspace(true);
        try {
            await axios.delete(`/api/workspaces/${workspace._id}`);
            toast.success("Workspace deleted");
            setShowDeleteWorkspaceConfirm(false);
            onClose();
            window.location.reload(); // Hard refresh to reset state/sidebar
        } catch {
            toast.error("Failed to delete workspace");
        } finally {
            setDeletingWorkspace(false);
        }
    };

    return (
        <>
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50">
            <div className="bg-white p-6 rounded-2xl w-[500px] relative shadow-2xl max-h-[80vh] overflow-y-auto">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"><X size={20}/></button>
                
                <h2 className="text-xl font-bold mb-4 text-gray-900">Workspace Members</h2>
                
                <div className="space-y-3">
                    {workspace.members.map((member) => (
                        <div key={member.user._id} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all shadow-sm">
                            <div className="flex items-center gap-3">
                                {/* Avatar or Initials */}
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
                                    {member.user.fullname.substring(0,2).toUpperCase()}
                                </div>
                                <div>
                                    <p className="text-sm font-semibold">{member.user.fullname}</p>
                                    <p className="text-xs text-gray-500">{member.user.email}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                {/* Role Badge */}
                                <span className={`text-xs px-3 py-1.5 rounded-lg capitalize font-medium
                                    ${member.role === 'owner' ? 'bg-purple-100 text-purple-700 border border-purple-200' : 
                                      member.role === 'admin' ? 'bg-orange-100 text-orange-700 border border-orange-200' : 'bg-gray-200 text-gray-700 border border-gray-300'}`}>
                                    {member.role}
                                </span>

                                {/* ACTIONS (Only visible if I am Owner) */}
                                {isOwner && member.role !== 'owner' && member.user._id !== userInfo._id && (
                                    <>
                                        {/* Promote/Demote Dropdown */}
                                        <select 
                                            className="text-xs border-2 border-gray-200 rounded-lg p-1.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                            value={member.role}
                                            onChange={(e) => handleRoleChange(member.user._id, e.target.value)}
                                        >
                                            <option value="admin">Admin</option>
                                            <option value="member">Member</option>
                                        </select>

                                        {/* Kick Button */}
                                        <button
                                            onClick={() => handleKick(member.user._id, member.user.fullname)}
                                            className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded-lg transition-all"
                                            title="Remove User"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </>
                                )}

                                {/* Admin can promote/remove members only */}
                                {isAdmin && member.role === 'member' && member.user._id !== userInfo._id && (
                                    <>
                                        <button
                                            onClick={() => handleRoleChange(member.user._id, 'admin')}
                                            className="text-xs border-2 border-gray-200 rounded-lg px-2.5 py-1.5 hover:bg-gray-100 transition-all"
                                            title="Promote to admin"
                                        >
                                            Make Admin
                                        </button>
                                        <button
                                            onClick={() => handleKick(member.user._id, member.user.fullname)}
                                            className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded-lg transition-all"
                                            title="Remove User"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* DANGER ZONE - Only for Owner */}
                {isOwner && (
                    <div className="mt-8 pt-4 border-t border-gray-200">
                        <h3 className="text-red-600 font-bold mb-2 text-sm uppercase tracking-wide">Danger Zone</h3>
                        <div className="flex justify-between items-center bg-red-50 p-4 rounded-xl border-2 border-red-200 shadow-sm">
                            <div>
                                <p className="font-bold text-gray-800 text-sm">Delete Workspace</p>
                                <p className="text-xs text-gray-600 mt-0.5">This action cannot be undone.</p>
                            </div>
                            <button 
                                onClick={handleDeleteWorkspace}
                                className="bg-white text-red-600 border-2 border-red-300 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-red-600 hover:text-white transition-all shadow-md hover:shadow-lg"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                )}
            </div>
            </div>

            <ConfirmModal
                isOpen={!!memberToRemove}
                title="Remove Member"
                message={`Remove ${memberToRemove?.fullname || 'this user'} from the workspace?`}
                confirmText="Remove"
                cancelText="Cancel"
                variant="danger"
                loading={removingMember}
                onClose={() => !removingMember && setMemberToRemove(null)}
                onConfirm={confirmKick}
            />

            <ConfirmModal
                isOpen={showDeleteWorkspaceConfirm}
                title="Delete Workspace"
                message="This action cannot be undone. Please confirm workspace deletion."
                confirmText="Delete Workspace"
                cancelText="Cancel"
                variant="danger"
                requireText={workspace?.name || ''}
                loading={deletingWorkspace}
                onClose={() => !deletingWorkspace && setShowDeleteWorkspaceConfirm(false)}
                onConfirm={confirmDeleteWorkspace}
            />
        </>
    );
};

export default MembersModal;
