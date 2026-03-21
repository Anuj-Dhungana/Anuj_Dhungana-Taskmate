import { X } from 'lucide-react';
import { useState } from 'react';

const AddChannelMembersModal = ({
    isOpen,
    channel,
    workspaceMembers = [],
    currentUserId,
    loading = false,
    error = '',
    onClose,
    onSubmit,
}) => {
    const [selectedMembers, setSelectedMembers] = useState([]);
    const [prevIsOpen, setPrevIsOpen] = useState(isOpen);

    if (isOpen !== prevIsOpen) {
        setPrevIsOpen(isOpen);
        if (isOpen) {
            setSelectedMembers([]);
        }
    }

    if (!isOpen || !channel) return null;

    // Filter out members who are already in the channel or is the current user
    const existingMemberIds = channel.members || [];
    const availableMembers = workspaceMembers.filter(
        m => m._id && m._id !== currentUserId && !existingMemberIds.includes(m._id)
    );

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 px-4">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">Add Members</h3>
                        <p className="text-xs text-gray-500">
                            Add workspace members to #{channel.name}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-600 disabled:opacity-50"
                        aria-label="Close modal"
                    >
                        <X size={16} />
                    </button>
                </div>

                <form
                    onSubmit={(event) => {
                        event.preventDefault();
                        if (selectedMembers.length > 0) {
                            onSubmit?.(selectedMembers);
                        }
                    }}
                    className="space-y-4"
                >
                    {error && <p className="mt-1 text-xs text-red-600">{error}</p>}

                    <div className="mt-3">
                        <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100">
                            {availableMembers.map(member => (
                                <label key={member._id} className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer">
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
                                            <img src={member.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
                                        ) : (
                                            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-semibold">
                                                {member.fullname?.charAt(0).toUpperCase() || 'U'}
                                            </div>
                                        )}
                                        <div>
                                            <span className="text-sm font-medium text-gray-800 block">{member.fullname}</span>
                                            <span className="text-xs text-gray-500 block">{member.email}</span>
                                        </div>
                                    </div>
                                </label>
                            ))}
                            {availableMembers.length === 0 && (
                                <div className="p-4 text-sm text-gray-500 text-center">
                                    No available members to add. Everyone is already in this channel.
                                </div>
                            )}
                        </div>
                    </div>

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
                            disabled={loading || selectedMembers.length === 0}
                            className="px-3 py-2 text-sm rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
                        >
                            {loading ? 'Adding...' : 'Add Members'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddChannelMembersModal;
