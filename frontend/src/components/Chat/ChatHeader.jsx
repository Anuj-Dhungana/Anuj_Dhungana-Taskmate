import { Hash, Phone, Video, Settings, Users as UsersIcon, Pencil, Trash2 } from 'lucide-react';

const ChatHeader = ({
    conversation,
    workspaceName,
    memberCount,
    isDM,
    canManage,
    showMenu,
    onMenuToggle,
    onRename,
    onDelete,
}) => {
    const displayName = isDM ? conversation?.displayName : conversation?.name;
    const displayEmail = conversation?.displayEmail;
    const isGeneral = conversation?.isGeneral;

    return (
        <div className="flex items-center justify-between px-5 py-3 border-b bg-white">
            <div className="flex items-center gap-3">
                {isDM ? (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 text-white flex items-center justify-center text-xs font-semibold">
                        {displayName?.substring(0, 1).toUpperCase() || 'U'}
                    </div>
                ) : (
                    <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
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
                <button className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:text-indigo-600 hover:border-indigo-200">
                    <Phone size={16} />
                </button>
                <button className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:text-indigo-600 hover:border-indigo-200">
                    <Video size={16} />
                </button>
                <div className="relative">
                    <button
                        onClick={onMenuToggle}
                        disabled={!canManage}
                        title={canManage ? 'Channel settings' : 'Only admins can manage channels'}
                        className={`w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center ${
                            canManage
                                ? 'text-gray-500 hover:text-indigo-600 hover:border-indigo-200'
                                : 'text-gray-300 bg-gray-50 cursor-not-allowed'
                        }`}
                    >
                        <Settings size={16} />
                    </button>
                    {showMenu && canManage && !isGeneral && (
                        <div className="absolute right-0 mt-2 w-44 rounded-lg border border-gray-200 bg-white shadow-lg z-20">
                            <button
                                onClick={onRename}
                                className="w-full px-3 py-2 text-left text-xs text-gray-700 hover:bg-gray-50"
                            >
                                <div className="flex items-center gap-2">
                                    <Pencil size={14} /> Rename channel
                                </div>
                            </button>
                            <button
                                onClick={onDelete}
                                className="w-full px-3 py-2 text-left text-xs text-red-600 hover:bg-red-50"
                            >
                                <div className="flex items-center gap-2">
                                    <Trash2 size={14} /> Delete channel
                                </div>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ChatHeader;
