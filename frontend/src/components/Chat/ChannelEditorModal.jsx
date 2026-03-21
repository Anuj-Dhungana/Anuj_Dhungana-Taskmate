import { X, Lock, Globe } from 'lucide-react';
import { useState } from 'react';

const ChannelEditorModal = ({
    isOpen,
    mode = 'create',
    value,
    error = '',
    loading = false,
    workspaceMembers = [],
    currentUserId = null,
    onChange,
    onClose,
    onSubmit,
}) => {
    const [isPrivate, setIsPrivate] = useState(false);
    const [selectedMembers, setSelectedMembers] = useState([]);
    const [prevIsOpen, setPrevIsOpen] = useState(isOpen);

    if (isOpen !== prevIsOpen) {
        setPrevIsOpen(isOpen);
        if (isOpen) {
            setIsPrivate(false);
            setSelectedMembers([]);
        }
    }

    if (!isOpen) return null;

    const isRename = mode === 'rename';
    const title = isRename ? 'Rename Channel' : 'Create Channel';
    const actionText = isRename ? 'Save Changes' : 'Create Channel';

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 px-4">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
                        <p className="text-xs text-gray-500">
                            {isRename ? 'Update the channel name.' : 'Add a new channel for your workspace.'}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-600 disabled:opacity-50"
                        aria-label="Close channel modal"
                    >
                        <X size={16} />
                    </button>
                </div>

                <form
                    onSubmit={(event) => {
                        event.preventDefault();
                        onSubmit?.(isPrivate ? selectedMembers : []);
                    }}
                    className="space-y-4"
                >
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Channel Name</label>
                        <input
                            value={value}
                            onChange={(event) => onChange?.(event.target.value)}
                            placeholder="e.g. product-updates"
                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                            autoFocus
                        />
                        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
                    </div>

                    {!isRename && (
                        <div>
                            <label className="flex items-center gap-2 mb-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={isPrivate}
                                    onChange={(e) => setIsPrivate(e.target.checked)}
                                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                                />
                                <span className="text-sm font-medium text-gray-700 flex items-center gap-1">
                                    {isPrivate ? <Lock size={14} className="text-gray-500" /> : <Globe size={14} className="text-gray-500" />}
                                    Make Private
                                </span>
                            </label>
                            {isPrivate && (
                                <div className="mt-3">
                                    <p className="text-xs text-gray-500 mb-2">Select members who can access this channel:</p>
                                    <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100">
                                        {workspaceMembers.filter(m => m._id && m._id !== currentUserId).map(member => (
                                            <label key={member._id} className="flex items-center gap-3 p-2 hover:bg-gray-50 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedMembers.includes(member._id)}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setSelectedMembers([...selectedMembers, member._id]);
                                                        } else {
                                                            setSelectedMembers(selectedMembers.filter(id => id !== member._id));
                                                        }
                                                    }}
                                                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                                                />
                                                <div className="flex items-center gap-2">
                                                    {member.avatar ? (
                                                        <img src={member.avatar} alt="" className="w-6 h-6 rounded-full object-cover" />
                                                    ) : (
                                                        <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-semibold">
                                                            {member.fullname?.charAt(0).toUpperCase() || 'U'}
                                                        </div>
                                                    )}
                                                    <span className="text-sm text-gray-700">{member.fullname}</span>
                                                </div>
                                            </label>
                                        ))}
                                        {workspaceMembers.filter(m => m._id && m._id !== currentUserId).length === 0 && (
                                            <div className="p-3 text-sm text-gray-500 text-center">No other members in this workspace.</div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="flex items-center justify-end gap-2 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={loading}
                            className="px-3 py-2 text-sm rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-3 py-2 text-sm rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
                        >
                            {loading ? 'Please wait...' : actionText}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ChannelEditorModal;
