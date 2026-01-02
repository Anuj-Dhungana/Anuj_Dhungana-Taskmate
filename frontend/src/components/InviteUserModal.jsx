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
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
            <div className="bg-white p-6 rounded-lg w-96 relative shadow-xl">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                    <X size={20} />
                </button>
                
                <h2 className="text-xl font-bold mb-1 flex items-center gap-2">
                    <UserPlus size={20} className="text-blue-600"/> Invite Member
                </h2>
                <p className="text-sm text-gray-500 mb-4">Add existing TaskMate users via email.</p>
                
                <form onSubmit={handleInvite}>
                    <input 
                        type="email" 
                        placeholder="Enter user email address" 
                        className="w-full p-2 mb-4 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                        value={email} 
                        onChange={e => setEmail(e.target.value)} 
                        required
                    />
                    
                    <button 
                        disabled={loading}
                        className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 disabled:bg-blue-300"
                    >
                        {loading ? 'Sending...' : 'Add to Workspace'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default InviteUserModal;