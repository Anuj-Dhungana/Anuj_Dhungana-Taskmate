import { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { X } from 'lucide-react';

const CreateWorkspaceModal = ({ onClose, onCreated }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post('/api/workspaces', { name, description });
            toast.success('Workspace created!');
            onCreated(); // Tell parent to refresh list
            onClose();   // Close modal
        } catch (err) {
            toast.error('Failed to create workspace');
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
            <div className="bg-white p-6 rounded-lg w-96 relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-500">
                    <X size={20} />
                </button>
                
                <h2 className="text-xl font-bold mb-4">Create New Workspace</h2>
                
                <form onSubmit={handleSubmit}>
                    <input 
                        type="text" placeholder="Workspace Name (e.g. Dev Team)" 
                        className="w-full p-2 mb-3 border rounded"
                        value={name} onChange={e => setName(e.target.value)} required
                    />
                    <textarea 
                        placeholder="Description (Optional)" 
                        className="w-full p-2 mb-4 border rounded"
                        value={description} onChange={e => setDescription(e.target.value)}
                    />
                    <button className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700">
                        Create
                    </button>
                </form>
            </div>
        </div>
    );
};

export default CreateWorkspaceModal;