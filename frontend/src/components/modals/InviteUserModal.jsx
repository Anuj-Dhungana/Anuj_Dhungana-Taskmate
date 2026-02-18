import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { X, UserPlus, Mail, Shield } from 'lucide-react';
import { inviteAPI } from '../../api/invites';

const InviteUserModal = ({ isOpen, onClose, workspaceId }) => {
    const [email, setEmail] = useState('');
    const [role, setRole] = useState('member');
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleInvite = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await inviteAPI.sendInvite({ workspaceId, email, role });
            toast.success(res.data.message);
            setEmail('');
            setRole('member');
            onClose();
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Failed to send invite');
        }
        setLoading(false);
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50">
            <div className="bg-white p-6 rounded-2xl w-96 relative shadow-2xl">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition">
                    <X size={20} />
                </button>
                
                <h2 className="text-xl font-bold mb-1 flex items-center gap-2">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                        <UserPlus size={20} className="text-blue-600"/>
                    </div>
                    Invite Member
                </h2>
                <p className="text-sm text-gray-500 mb-5">Send a pending invite. User must accept to join.</p>
                
                <form onSubmit={handleInvite}>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            <Mail className="w-4 h-4 inline mr-1" />
                            Email Address
                        </label>
                        <input 
                            type="email" 
                            placeholder="user@example.com" 
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                            value={email} 
                            onChange={e => setEmail(e.target.value)} 
                            required
                        />
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            <Shield className="w-4 h-4 inline mr-1" />
                            Role
                        </label>
                        <select
                            value={role}
                            onChange={e => setRole(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition bg-white"
                        >
                            <option value="member">Member - Can view and work on projects</option>
                            <option value="admin">Admin - Can manage workspace and invite others</option>
                        </select>
                    </div>
                    
                    <button 
                        type="submit"
                        disabled={loading}
                        className="w-full bg-linear-to-r from-blue-600 to-blue-700 text-white py-3 rounded-xl hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition shadow-lg shadow-blue-500/30"
                    >
                        {loading ? 'Sending Invite...' : 'Send Invite'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default InviteUserModal;