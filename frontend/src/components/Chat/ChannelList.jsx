import { Hash, Plus } from 'lucide-react';

const ChannelList = ({ channels, selectedChannel, onSelectChannel, canManageChannels, onCreateChannel }) => {
    return (
        <div>
            <div className="flex items-center justify-between text-[11px] uppercase tracking-wider text-gray-500 mb-2">
                <span>Channels</span>
                {canManageChannels && (
                    <button
                        onClick={onCreateChannel}
                        className="text-indigo-600 hover:text-indigo-700"
                        title="Create channel"
                    >
                        <Plus size={14} />
                    </button>
                )}
            </div>
            <div className="space-y-1">
                {channels.length === 0 && (
                    <div className="text-xs text-gray-500 px-2 py-2">No channels found.</div>
                )}
                {channels.map((ch) => {
                    const isActive = selectedChannel?._id === ch._id;
                    const hasUnread = Number(ch.unreadCount) > 0;
                    const badgeLabel = ch.unreadCount > 99 ? '99+' : ch.unreadCount;
                    return (
                        <button
                            key={ch._id}
                            onClick={() => onSelectChannel({ ...ch, type: ch.type || 'channel' })}
                            className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2 border-l-4 transition ${
                                isActive
                                    ? 'bg-indigo-50 text-indigo-700 border-indigo-500'
                                    : 'text-gray-700 border-transparent hover:bg-white'
                            }`}
                        >
                            <Hash size={14} className={isActive ? 'text-indigo-600' : 'text-gray-400'} />
                            <span className="truncate">{ch.name}</span>
                            {(hasUnread || ch.isGeneral) && (
                                <div className="ml-auto flex items-center gap-1">
                                    {ch.isGeneral && (
                                        <span className="text-[10px] text-gray-400">default</span>
                                    )}
                                    {hasUnread && (
                                        <span className="min-w-5 h-5 px-1 rounded-full bg-indigo-600 text-white text-[10px] font-semibold flex items-center justify-center">
                                            {badgeLabel}
                                        </span>
                                    )}
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default ChannelList;
