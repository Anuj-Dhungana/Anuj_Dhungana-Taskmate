import { useMemo, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { X, Kanban } from 'lucide-react';

const CreateProjectModal = ({ isOpen, onClose, workspaceId, onCreated, members = [] }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState('Planning');
    const [startDate, setStartDate] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [tags, setTags] = useState('');
    const [selectedMembers, setSelectedMembers] = useState({}); // { userId: role }
    const [isMemberPickerOpen, setIsMemberPickerOpen] = useState(false);

    const memberList = useMemo(() => members || [], [members]);
    const memberLookup = useMemo(() => {
        const map = {};
        memberList.forEach((m) => {
            map[m.user._id] = m.user.fullname;
        });
        return map;
    }, [memberList]);
    const selectedList = useMemo(
        () =>
            Object.entries(selectedMembers).map(([userId, role]) => ({
                userId,
                role,
                name: memberLookup[userId] || 'Member',
            })),
        [selectedMembers, memberLookup]
    );

    const toggleMember = (userId) => {
        setSelectedMembers((prev) => {
            const copy = { ...prev };
            if (copy[userId]) {
                delete copy[userId];
            } else {
                copy[userId] = 'Contributor';
            }
            return copy;
        });
    };

    const updateMemberRole = (userId, role) => {
        setSelectedMembers((prev) => ({ ...prev, [userId]: role }));
    };

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await axios.post('/api/projects', { 
                name, 
                description, 
                workspaceId,
                status,
                startDate,
                dueDate,
                tags: tags
                    .split(',')
                    .map((t) => t.trim())
                    .filter(Boolean),
                members: Object.entries(selectedMembers).map(([user, role]) => ({ user, role })),
            });
            toast.success('Project created!');
            setName('');
            setDescription('');
            setStatus('Planning');
            setStartDate('');
            setDueDate('');
            setTags('');
            setSelectedMembers({});
            setIsMemberPickerOpen(false);
            onCreated(); // Refresh the list
            onClose();
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Failed to create project');
        }
        setLoading(false);
    };

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg border border-gray-200">
                <div className="flex items-start justify-between px-6 py-4 border-b">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">Create Project</h2>
                        <p className="text-xs text-gray-500 mt-1">Make a new project to start tracking progress.</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Project title</label>
                        <input
                            type="text"
                            className="w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            placeholder="Project title"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Description</label>
                        <textarea
                            className="w-full border rounded-md px-3 py-2 text-sm h-20 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            placeholder="Project description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Status</label>
                        <select
                            className="w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                        >
                            {['Planning', 'In Progress', 'On Hold', 'Completed'].map((s) => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Start Date</label>
                            <input
                                type="date"
                                className="w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Due Date</label>
                            <input
                                type="date"
                                className="w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                value={dueDate}
                                onChange={(e) => setDueDate(e.target.value)}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Tags</label>
                        <input
                            type="text"
                            className="w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            placeholder="Enter tags separated by commas (e.g., web, mobile, backend)"
                            value={tags}
                            onChange={(e) => setTags(e.target.value)}
                        />
                    </div>

                    <div className="relative">
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Members</label>
                        <button
                            type="button"
                            onClick={() => setIsMemberPickerOpen((v) => !v)}
                            className="w-full border rounded-md px-3 py-2 text-left text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                        >
                            {selectedList.length === 0 ? (
                                <span className="text-gray-400">Select members</span>
                            ) : (
                                <div className="flex flex-wrap gap-2">
                                    {selectedList.map((m) => (
                                        <span
                                            key={m.userId}
                                            className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-50 text-blue-700 text-xs border border-blue-100"
                                        >
                                            {m.name}
                                            <span className="text-[11px] text-blue-600">({m.role})</span>
                                        </span>
                                    ))}
                                </div>
                            )}
                        </button>

                        {isMemberPickerOpen && (
                            <div className="absolute left-0 right-0 mt-2 bg-white border rounded-md shadow-xl max-h-60 overflow-y-auto z-20 divide-y">
                                {memberList.length === 0 && (
                                    <p className="text-xs text-gray-400 px-3 py-2">No members available</p>
                                )}
                                {memberList.map((m) => {
                                    const isChecked = Boolean(selectedMembers[m.user._id]);
                                    const role = selectedMembers[m.user._id] || 'Contributor';
                                    return (
                                        <div key={m.user._id} className="flex items-center justify-between px-3 py-2 text-sm bg-white">
                                            <label className="flex items-center gap-2 text-gray-700">
                                                <input
                                                    type="checkbox"
                                                    checked={isChecked}
                                                    onChange={() => toggleMember(m.user._id)}
                                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                />
                                                <span>{m.user.fullname}</span>
                                            </label>
                                            <select
                                                value={role}
                                                onChange={(e) => updateMemberRole(m.user._id, e.target.value)}
                                                disabled={!isChecked}
                                                className="text-sm border rounded-md px-2 py-1 text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                                            >
                                                <option value="Manager">Manager</option>
                                                <option value="Contributor">Contributor</option>
                                                <option value="Viewer">Viewer</option>
                                            </select>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
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
                            disabled={loading}
                            className="px-4 py-2 text-sm rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60"
                        >
                            {loading ? 'Creating...' : 'Create project'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateProjectModal;