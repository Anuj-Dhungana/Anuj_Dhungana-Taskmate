import { Hash, Users as UsersIcon, UserPlus, Edit, Trash2, MoreVertical } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

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
    
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsMenuOpen(false);
            }
        };

        if (isMenuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isMenuOpen]);

    const showAddMembers = !isDM && conversation?.members?.length > 0 && canManage;
    const showRenameDelete = !isDM && canManage && !conversation?.isGeneral;

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

            <div className="flex items-center gap-2 relative" ref={menuRef}>
                {(showAddMembers || showRenameDelete) && (
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                        title="Channel Options"
                    >
                        <MoreVertical size={18} />
                    </button>
                )}

                {isMenuOpen && (
                    <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50">
                        {showAddMembers && (
                            <button
                                onClick={() => {
                                    setIsMenuOpen(false);
                                    onAddMembers();
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors"
                            >
                                <UserPlus size={15} className="text-gray-400" />
                                Add Members
                            </button>
                        )}
                        
                        {showAddMembers && showRenameDelete && (
                            <div className="h-px bg-gray-100 my-1"></div>
                        )}
                        
                        {showRenameDelete && (
                            <>
                                <button
                                    onClick={() => {
                                        setIsMenuOpen(false);
                                        onRename();
                                    }}
                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors"
                                >
                                    <Edit size={15} className="text-gray-400" />
                                    Rename Channel
                                </button>
                                <button
                                    onClick={() => {
                                        setIsMenuOpen(false);
                                        onDelete();
                                    }}
                                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                                >
                                    <Trash2 size={15} className="text-red-400" />
                                    Delete Channel
                                </button>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChatHeader;
