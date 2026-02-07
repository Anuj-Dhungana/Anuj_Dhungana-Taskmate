import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { X, Calendar as CalendarIcon } from 'lucide-react';
import { toast } from 'react-hot-toast';
import useAuthStore from '../../store/useAuthStore';
import { emitProjectDataChanged } from '../../utils/projectEvents';

const CreateTaskModal = ({ isOpen, onClose, projectId, lists = [], workspaceMembers = [], onCreated }) => {
    const { userInfo } = useAuthStore();
    const statusOptions = useMemo(() => {
        const mapByLower = lists.reduce((acc, l) => {
            const key = (l.title || '').toLowerCase();
            if (!acc[key]) acc[key] = l;
            return acc;
        }, {});
        const desired = ['to do', 'in progress', 'done'];
        return desired.map((label) => ({
            label: label.replace(/\b\w/g, (c) => c.toUpperCase()),
            list: mapByLower[label] || null,
        }));
    }, [lists]);

    const defaultListId = useMemo(() => {
        const firstAvailable = statusOptions.find((o) => o.list?._id);
        return firstAvailable?.list?._id || lists[0]?._id || '';
    }, [statusOptions, lists]);

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [listId, setListId] = useState(defaultListId);
    const [priority, setPriority] = useState('Medium');
    const [dueDate, setDueDate] = useState('');
    const [assignees, setAssignees] = useState([]);
    const [assigneeOpen, setAssigneeOpen] = useState(false);
    const [statusOpen, setStatusOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const myRole = workspaceMembers.find((m) => m.user?._id === userInfo?._id)?.role;
    const canAssign = myRole === 'owner' || myRole === 'admin';
    const selfId = userInfo?._id;

    useEffect(() => {
        setListId(defaultListId);
    }, [defaultListId, isOpen]);

    useEffect(() => {
        if (!canAssign && selfId && isOpen) {
            setAssignees([selfId]);
        }
    }, [canAssign, selfId, isOpen]);

    if (!isOpen) return null;

    const toggleAssignee = (id) => {
        if (!canAssign) return;
        setAssignees((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title.trim() || !listId) return;
        setLoading(true);
        try {
            const payload = {
                title,
                description,
                listId,
                projectId,
                priority,
                dueDate,
            };
            if (canAssign) {
                payload.assignees = assignees;
            } else if (selfId) {
                payload.assignees = [selfId];
            }
            const res = await axios.post('/api/board/cards', payload);
            toast.success('Task created');
            emitProjectDataChanged({
                projectId,
                source: 'create-task-modal',
            });
            onCreated?.(res.data);
            setTitle('');
            setDescription('');
            setPriority('Medium');
            setDueDate('');
            setAssignees([]);
            setAssigneeOpen(false);
            setStatusOpen(false);
            onClose();
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Failed to create task');
        }
        setLoading(false);
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <h2 className="text-lg font-bold text-gray-900">Create New Task</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Title</label>
                        <input
                            type="text"
                            className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                            placeholder="Task title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Description</label>
                        <textarea
                            className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm h-24 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none"
                            placeholder="Task description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="relative">
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Status</label>
                            <button
                                type="button"
                                onClick={() => setStatusOpen((v) => !v)}
                                className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-left text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white transition-all"
                            >
                                {statusOptions.find((o) => o.list?._id === listId)?.label || lists.find((l) => l._id === listId)?.title || 'Select status'}
                            </button>
                            {statusOpen && (
                                <div className="absolute left-0 right-0 mt-2 bg-white border-2 border-gray-200 rounded-xl shadow-xl z-30 overflow-hidden">
                                    {statusOptions.map((opt) => (
                                        <button
                                            key={opt.label}
                                            type="button"
                                            disabled={!opt.list}
                                            onClick={() => {
                                                if (!opt.list) return;
                                                setListId(opt.list._id);
                                                setStatusOpen(false);
                                            }}
                                            className={`w-full text-left px-4 py-2.5 text-sm flex items-center justify-between transition-colors ${
                                                listId === opt.list?._id ? 'text-gray-900 font-semibold bg-blue-50' : 'text-gray-700'
                                            } ${opt.list ? 'hover:bg-gray-50' : 'opacity-50 cursor-not-allowed'}`}
                                        >
                                            <span>{opt.label}</span>
                                            {listId === opt.list?._id && <span className="text-blue-500 text-xs">✓</span>}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Priority</label>
                            <select
                                className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white"
                                value={priority}
                                onChange={(e) => setPriority(e.target.value)}
                            >
                                {['Low', 'Medium', 'High'].map((p) => (
                                    <option key={p} value={p}>
                                        {p}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Due Date</label>
                        <div className="flex items-center gap-2 border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all">
                            <CalendarIcon size={16} className="text-gray-400" />
                            <input
                                type="date"
                                className="flex-1 bg-transparent outline-none"
                                value={dueDate}
                                onChange={(e) => setDueDate(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="relative">
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Assignees</label>
                        {canAssign ? (
                            <>
                                <button
                                    type="button"
                                    onClick={() => setAssigneeOpen((v) => !v)}
                                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-left text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white transition-all"
                                >
                                    {assignees.length === 0 ? (
                                        <span className="text-gray-400">Select assignees</span>
                                    ) : (
                                        workspaceMembers
                                            .filter((m) => assignees.includes(m.user._id))
                                            .map((m) => m.user.fullname)
                                            .join(', ')
                                    )}
                                </button>

                                {assigneeOpen && (
                                    <div className="absolute left-0 right-0 mt-2 bg-white border-2 border-gray-200 rounded-xl shadow-xl max-h-60 overflow-y-auto z-20 divide-y divide-gray-100">
                                        {workspaceMembers.length === 0 && (
                                            <p className="text-xs text-gray-400 px-3 py-2">No members available</p>
                                        )}
                                        {workspaceMembers.map((m) => {
                                            const checked = assignees.includes(m.user._id);
                                            return (
                                                <label
                                                    key={m.user._id}
                                                    className="flex items-center justify-between px-4 py-2.5 text-sm bg-white hover:bg-gray-50 cursor-pointer transition-colors"
                                                >
                                                    <span className="flex items-center gap-2 text-gray-700">
                                                        <input
                                                            type="checkbox"
                                                            checked={checked}
                                                            onChange={() => toggleAssignee(m.user._id)}
                                                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                        />
                                                        {m.user.fullname}
                                                    </span>
                                                </label>
                                            );
                                        })}
                                    </div>
                                )}
                            </>
                        ) : (
                            <div
                                className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-left text-sm bg-gray-50 text-gray-500"
                                title="Only admins can assign members"
                            >
                                Assigned to you
                            </div>
                        )}
                        {!canAssign && (
                            <p className="text-[11px] text-gray-400 mt-1">Only admins can assign members.</p>
                        )}
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 text-sm border-2 border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 transition-all font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2.5 text-sm rounded-xl text-white bg-linear-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:opacity-60 transition-all font-medium shadow-lg shadow-blue-500/30"
                        >
                            {loading ? 'Creating...' : 'Create Task'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateTaskModal;
