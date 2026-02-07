import { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { X, UserPlus } from 'lucide-react';

const InviteUserModal = ({ isOpen, onClose, workspaceId }) => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleInvite = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await axios.post(`/api/workspaces/${workspaceId}/invite`, { email });
            toast.success(res.data.message);
            setEmail('');
            onClose();
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Failed to invite user');
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
                <p className="text-sm text-gray-500 mb-5">Add existing TaskMate users via email.</p>
                
                <form onSubmit={handleInvite}>
                    <input 
                        type="email" 
                        placeholder="Enter user email address" 
                        className="w-full px-4 py-3 mb-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                        value={email} 
                        onChange={e => setEmail(e.target.value)} 
                        required
                    />
                    
                    <button 
                        disabled={loading}
                        className="w-full bg-linear-to-r from-blue-600 to-blue-700 text-white py-3 rounded-xl hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition shadow-lg shadow-blue-500/30"
                    >
                        {loading ? 'Sending...' : 'Add to Workspace'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default InviteUserModal;