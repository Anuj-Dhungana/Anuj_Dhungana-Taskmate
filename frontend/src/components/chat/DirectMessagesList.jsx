import { Plus } from 'lucide-react';

const DirectMessagesList = ({ dmThreads, selectedChannel, onSelectChannel, onCreateDm }) => {
    return (
        <div>
            <div className="flex items-center justify-between text-[11px] uppercase tracking-wider text-indigo-400 font-semibold mb-2">
                <span>Direct Messages</span>
                <button
                    onClick={onCreateDm}
                    className="text-indigo-600 hover:text-indigo-700"
                    title="Start a DM"
                >
                    <Plus size={14} />
                </button>
            </div>
            <div className="space-y-1">
                {dmThreads.length === 0 && (
                    <div className="text-xs text-gray-500 px-2 py-2">No direct messages yet.</div>
                )}
                {dmThreads.map((dm) => {
                    const isActive = selectedChannel?._id === dm._id;
                    return (
                        <button
                            key={dm._id}
                            type="button"
                            onClick={() => onSelectChannel(dm)}
                            className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2 border-l-4 transition ${
                                isActive
                                    ? 'bg-white/80 text-indigo-700 border-indigo-500 shadow-sm'
                                    : 'text-indigo-900/70 border-transparent hover:bg-white/60'
                            }`}
                        >
                            <div className="relative w-8 h-8 shrink-0">
                                {dm.displayAvatar ? (
                                    <img
                                        src={dm.displayAvatar}
                                        alt={dm.displayName || 'User'}
                                        className="w-8 h-8 rounded-full object-cover border border-gray-200"
                                        onError={(event) => {
                                            event.currentTarget.style.display = 'none';
                                            const fallback = event.currentTarget.nextElementSibling;
                                            if (fallback) fallback.style.display = 'flex';
                                        }}
                                    />
                                ) : null}
                                <div
                                    className="w-8 h-8 rounded-full bg-linear-to-br from-indigo-500 to-blue-600 text-white hidden items-center justify-center text-xs font-semibold"
                                    style={{ display: dm.displayAvatar ? 'none' : 'flex' }}
                                >
                                    {dm.displayName?.substring(0, 1).toUpperCase() || 'U'}
                                </div>
                            </div>
                            <div className="min-w-0">
                                <div className="text-sm font-medium truncate">{dm.displayName}</div>
                                <div className="text-[11px] text-gray-400 truncate">{dm.displayEmail}</div>
                            </div>
                            {dm.unreadCount > 0 && (
                                <span
                                    className="ml-auto min-w-5 h-5 px-1 rounded-full bg-indigo-600 text-white text-[10px] font-semibold flex items-center justify-center"
                                    title={`${dm.unreadCount} unread message${dm.unreadCount > 1 ? 's' : ''}`}
                                >
                                    {dm.unreadCount > 99 ? '99+' : dm.unreadCount}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default DirectMessagesList;
