import { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { X } from 'lucide-react';

const CreateWorkspaceModal = ({ onClose, onCreated }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const colorOptions = ['#F97316', '#22C55E', '#FACC15', '#14B8A6', '#A855F7', '#22D3EE', '#60A5FA', '#0F172A'];
    const [color, setColor] = useState(colorOptions[0]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!name.trim()) {
            toast.error('Please enter a workspace name');
            return;
        }

        setIsLoading(true);
        try {
            await axios.post('/api/workspaces', { name, description, color });
            toast.success('Workspace created successfully!');
            onCreated();
            onClose();
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Failed to create workspace');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg border border-gray-200">
                <div className="flex items-start justify-between px-6 py-4 border-b">
                    <div className="space-y-1">
                        <h2 className="text-lg font-semibold text-gray-900">Create New Workspace</h2>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Workspace Name</label>
                        <input
                            type="text"
                            className="w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            placeholder="Workspace Name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Workspace Description</label>
                        <textarea
                            className="w-full border rounded-md px-3 py-2 text-sm h-20 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            placeholder="Workspace Description (optional)"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-2">Workspace Color</label>
                        <div className="flex items-center gap-3 flex-wrap">
                            {colorOptions.map((c) => {
                                const isActive = c === color;
                                return (
                                    <button
                                        type="button"
                                        key={c}
                                        onClick={() => setColor(c)}
                                        className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition ${
                                            isActive ? 'border-blue-500' : 'border-transparent hover:border-gray-300'
                                        }`}
                                        aria-label={`Select color ${c}`}
                                    >
                                        <span
                                            className="w-6 h-6 rounded-full"
                                            style={{ backgroundColor: c }}
                                        />
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm border rounded-md text-gray-700 hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="px-4 py-2 text-sm rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60"
                        >
                            {isLoading ? 'Creating...' : 'Create'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateWorkspaceModal;