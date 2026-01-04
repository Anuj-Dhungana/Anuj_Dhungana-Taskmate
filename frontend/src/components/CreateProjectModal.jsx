import { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { X, Kanban } from 'lucide-react';

const CreateProjectModal = ({ isOpen, onClose, workspaceId, onCreated }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await axios.post('/api/projects', { 
                name, 
                description, 
                workspaceId 
            });
            toast.success('Project created!');
            setName('');
            setDescription('');
            onCreated(); // Refresh the list
            onClose();
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Failed to create project');
        }
        setLoading(false);
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
            <div className="bg-white p-6 rounded-lg w-96 relative shadow-xl">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-700">
                    <X size={20} />
                </button>
                
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Kanban className="text-blue-600"/> New Project
                </h2>
                
                <form onSubmit={handleSubmit}>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Project Name</label>
                    <input 
                        type="text" 
                        placeholder="e.g. Website Redesign" 
                        className="w-full p-2 mb-3 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                        value={name} onChange={e => setName(e.target.value)} required
                    />

                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Description</label>
                    <textarea 
                        placeholder="What is this project about?" 
                        className="w-full p-2 mb-4 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                        value={description} onChange={e => setDescription(e.target.value)}
                    />

                    <button disabled={loading} className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 disabled:bg-blue-300">
                        {loading ? 'Creating...' : 'Create Project'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default CreateProjectModal;