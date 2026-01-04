import { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { X, Shield, Trash2, User } from 'lucide-react';
import useAuthStore from '../store/useAuthStore';

const MembersModal = ({ isOpen, onClose, workspace, onUpdate }) => {
    const { userInfo } = useAuthStore();
    
    // Find MY role
    const myRole = workspace?.members.find(m => m.user._id === userInfo._id)?.role;
    const isOwner = myRole === 'owner';

    if (!isOpen || !workspace) return null;

    const handleRoleChange = async (userId, newRole) => {
        try {
            await axios.put(`/api/workspaces/${workspace._id}/role`, { 
                memberId: userId, 
                newRole 
            });
            toast.success('Role updated');
            onUpdate(); // Refresh data
        } catch (err) {
            toast.error('Failed to update role');
        }
    };

    const handleKick = async (userId) => {
        if(!confirm("Are you sure you want to remove this user?")) return;
        try {
            await axios.delete(`/api/workspaces/${workspace._id}/members/${userId}`);
            toast.success('Member removed');
            onUpdate();
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Failed to remove');
        }
    };

    const handleDeleteWorkspace = async () => {
        const confirmName = prompt(`To confirm deletion, type "${workspace.name}"`);
        if (confirmName !== workspace.name) {
            return toast.error("Workspace name did not match.");
        }

        try {
            await axios.delete(`/api/workspaces/${workspace._id}`);
            toast.success("Workspace deleted");
            onClose();
            window.location.reload(); // Hard refresh to reset state/sidebar
        } catch (err) {
            toast.error("Failed to delete workspace");
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
            <div className="bg-white p-6 rounded-lg w-[500px] relative shadow-xl max-h-[80vh] overflow-y-auto">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-500"><X size={20}/></button>
                
                <h2 className="text-xl font-bold mb-4">Workspace Members</h2>
                
                <div className="space-y-3">
                    {workspace.members.map((member) => (
                        <div key={member.user._id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                            <div className="flex items-center gap-3">
                                {/* Avatar or Initials */}
                                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs">
                                    {member.user.fullname.substring(0,2).toUpperCase()}
                                </div>
                                <div>
                                    <p className="text-sm font-semibold">{member.user.fullname}</p>
                                    <p className="text-xs text-gray-500">{member.user.email}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                {/* Role Badge */}
                                <span className={`text-xs px-2 py-1 rounded capitalize 
                                    ${member.role === 'owner' ? 'bg-purple-100 text-purple-700' : 
                                      member.role === 'admin' ? 'bg-orange-100 text-orange-700' : 'bg-gray-200 text-gray-600'}`}>
                                    {member.role}
                                </span>

                                {/* ACTIONS (Only visible if I am Owner) */}
                                {isOwner && member.role !== 'owner' && (
                                    <>
                                        {/* Promote/Demote Dropdown */}
                                        <select 
                                            className="text-xs border rounded p-1"
                                            value={member.role}
                                            onChange={(e) => handleRoleChange(member.user._id, e.target.value)}
                                        >
                                            <option value="admin">Admin</option>
                                            <option value="member">Member</option>
                                        </select>

                                        {/* Kick Button */}
                                        <button 
                                            onClick={() => handleKick(member.user._id)}
                                            className="text-red-500 hover:text-red-700"
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
                    <div className="mt-8 pt-4 border-t border-red-100">
                        <h3 className="text-red-600 font-bold mb-2 text-sm uppercase">Danger Zone</h3>
                        <div className="flex justify-between items-center bg-red-50 p-3 rounded border border-red-200">
                            <div>
                                <p className="font-bold text-gray-800 text-sm">Delete Workspace</p>
                                <p className="text-xs text-gray-600">This action cannot be undone.</p>
                            </div>
                            <button 
                                onClick={handleDeleteWorkspace}
                                className="bg-white text-red-600 border border-red-200 px-3 py-1 rounded text-sm font-semibold hover:bg-red-600 hover:text-white transition"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MembersModal;