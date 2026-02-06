import { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import useWorkspaceStore from '../store/useWorkspaceStore';

const Settings = () => {
    const { currentWorkspaceId, selectedWorkspace, setSelectedWorkspace, setCurrentWorkspaceId } = useWorkspaceStore();
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [color, setColor] = useState('#F97316');
    const [loading, setLoading] = useState(false);
    const colorOptions = ['#F97316', '#22C55E', '#FACC15', '#14B8A6', '#A855F7', '#22D3EE', '#60A5FA', '#0F172A'];

    useEffect(() => {
        if (selectedWorkspace?.workspace) {
            setName(selectedWorkspace.workspace.name || '');
            setDescription(selectedWorkspace.workspace.description || '');
            setColor(selectedWorkspace.workspace.color || '#F97316');
        }
    }, [selectedWorkspace]);

    const handleSave = async (e) => {
        e.preventDefault();
        if (!currentWorkspaceId) return;
        setLoading(true);
        try {
            const res = await axios.put(`/api/workspaces/${currentWorkspaceId}`, {
                name,
                description,
                color,
            });
            toast.success('Workspace updated');
            if (selectedWorkspace) {
                setSelectedWorkspace({
                    ...selectedWorkspace,
                    workspace: res.data,
                });
            } else {
                setSelectedWorkspace({ workspace: res.data, projects: [], channels: [] });
            }
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Failed to update workspace');
        }
        setLoading(false);
    };

    const handleDelete = async () => {
        if (!currentWorkspaceId) return;
        const confirmName = prompt(`To confirm deletion, type "${name}"`);
        if (confirmName !== name) {
            return toast.error('Workspace name did not match.');
        }
        try {
            await axios.delete(`/api/workspaces/${currentWorkspaceId}`);
            toast.success('Workspace deleted');
            setCurrentWorkspaceId(null);
            setSelectedWorkspace(null);
            window.location.assign('/dashboard');
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Failed to delete workspace');
        }
    };

    if (!currentWorkspaceId) {
        return (
            <div className="px-8 py-10">
                <div className="text-center text-gray-500">Select a workspace to manage settings.</div>
            </div>
        );
    }

    return (
        <div className="px-8 py-10">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Workspace Settings</h1>
                <p className="text-gray-500 mt-2">Manage the selected workspace.</p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 max-w-2xl">
                <form onSubmit={handleSave} className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Workspace Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent h-24 resize-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Workspace Color</label>
                        <div className="flex items-center gap-3 flex-wrap">
                            {colorOptions.map((c) => {
                                const isActive = c === color;
                                return (
                                    <button
                                        type="button"
                                        key={c}
                                        onClick={() => setColor(c)}
                                        className={`w-9 h-9 rounded-full border-2 flex items-center justify-center transition-all ${
                                            isActive ? 'border-blue-500 scale-110 shadow-lg' : 'border-transparent hover:border-gray-300 hover:scale-105'
                                        }`}
                                        aria-label={`Select color ${c}`}
                                    >
                                        <span className="w-6 h-6 rounded-full" style={{ backgroundColor: c }} />
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold disabled:opacity-60"
                        >
                            {loading ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>

                <div className="mt-10 pt-6 border-t border-gray-200">
                    <h3 className="text-red-600 font-bold mb-2 text-sm uppercase tracking-wide">Danger Zone</h3>
                    <div className="flex items-center justify-between bg-red-50 p-4 rounded-xl border-2 border-red-200">
                        <div>
                            <p className="font-bold text-gray-800 text-sm">Delete Workspace</p>
                            <p className="text-xs text-gray-600 mt-0.5">This action cannot be undone.</p>
                        </div>
                        <button
                            onClick={handleDelete}
                            className="bg-white text-red-600 border-2 border-red-300 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-red-600 hover:text-white transition-all"
                        >
                            Delete
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;
