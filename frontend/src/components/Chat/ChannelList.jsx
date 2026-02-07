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
                            {ch.isGeneral && (
                                <span className="ml-auto text-[10px] text-gray-400">default</span>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default ChannelList;
