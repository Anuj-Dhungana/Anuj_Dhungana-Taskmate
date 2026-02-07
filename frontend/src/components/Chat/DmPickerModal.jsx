import { X, Search } from 'lucide-react';

const DmPickerModal = ({ isOpen, members, searchTerm, onSearchChange, onSelectMember, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">Start a Direct Message</h3>
                        <p className="text-xs text-gray-500">Choose a member to chat with.</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-600"
                    >
                        <X size={16} />
                    </button>
                </div>
                <div className="relative mb-3">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        value={searchTerm}
                        onChange={(e) => onSearchChange(e.target.value)}
                        placeholder="Search members"
                        className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                    />
                </div>
                <div className="max-h-64 overflow-y-auto divide-y divide-gray-100">
                    {members.length === 0 && (
                        <div className="text-sm text-gray-400 py-4 text-center">No members found.</div>
                    )}
                    {members.map((user) => (
                        <button
                            key={user._id}
                            onClick={() => onSelectMember(user._id)}
                            className="w-full flex items-center gap-3 px-3 py-3 text-left hover:bg-gray-50"
                        >
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 text-white flex items-center justify-center text-xs font-semibold">
                                {user.fullname?.substring(0, 1).toUpperCase() || 'U'}
                            </div>
                            <div>
                                <div className="text-sm font-medium text-gray-800">{user.fullname}</div>
                                <div className="text-xs text-gray-400">{user.email}</div>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default DmPickerModal;
