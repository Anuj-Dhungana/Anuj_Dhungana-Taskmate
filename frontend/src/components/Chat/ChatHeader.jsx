import { Hash, Users as UsersIcon, UserPlus } from 'lucide-react';

const ChatHeader = ({
    conversation,
    workspaceName,
    memberCount,
    isDM,
    canManage = false,
    onAddMembers,
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
                    >
                        <UserPlus size={14} />
                        Add Members
                    </button>
                )}
            </div>
        </div>
    );
};

export default ChatHeader;
