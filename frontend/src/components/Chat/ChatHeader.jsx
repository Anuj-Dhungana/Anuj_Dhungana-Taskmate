import { Hash, Users as UsersIcon, UserPlus, Edit, Trash2 } from 'lucide-react';

const ChatHeader = ({
    conversation,
    workspaceName,
    memberCount,
    isDM,
    canManage = false,
    onAddMembers,
    onRename,
    onDelete,
}) => {
    const displayName = isDM ? conversation?.displayName : conversation?.name;
    const displayEmail = conversation?.displayEmail;

    return (
        <div className="flex items-center justify-between px-5 border-b border-gray-200 bg-gray-50" style={{ minHeight: '64px' }}>
            <div className="flex items-center gap-3">
                {isDM ? (
                    <div className="w-10 h-10 rounded-full bg-linear-to-br from-indigo-500 to-blue-600 text-white flex items-center justify-center text-xs font-semibold">
                        {displayName?.substring(0, 1).toUpperCase() || 'U'}
                    </div>
                ) : (
                    <div className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
                        <Hash size={18} />
                    </div>
                )}
                <div>
                    <div className="text-xs text-gray-400">{workspaceName}</div>
                    <div className="text-sm font-semibold text-gray-900">
                        {isDM ? displayName : `# ${displayName}`}
                    </div>
                    <div className="text-[11px] text-gray-500 flex items-center gap-2">
                        {isDM ? (
                            <span>{displayEmail || 'Direct message'}</span>
                        ) : (
                            <>
                                <UsersIcon size={12} /> {memberCount} members
                            </>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-2">
                {!isDM && conversation?.members?.length > 0 && canManage && (
                    <button
                        onClick={onAddMembers}
                        className="px-3 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-md hover:bg-indigo-100 hover:border-indigo-200 flex items-center gap-1.5 transition-colors"
                        title="Add Members"
                    >
                        <UserPlus size={14} />
                        <span className="hidden sm:inline">Add Members</span>
                    </button>
                )}
                {!isDM && canManage && !conversation?.isGeneral && (
                    <>
                        <button
                            onClick={onRename}
                            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                            title="Rename Channel"
                        >
                            <Edit size={16} />
                        </button>
                        <button
                            onClick={onDelete}
                            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                            title="Delete Channel"
                        >
                            <Trash2 size={16} />
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

export default ChatHeader;
