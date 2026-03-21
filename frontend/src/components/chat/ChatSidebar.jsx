import { Search } from 'lucide-react';

const ChatSidebar = ({ search, onSearchChange, children }) => {
    return (
        <aside className="w-72 shrink-0 min-h-0 flex flex-col border-r border-indigo-100" style={{ background: 'linear-gradient(160deg, #eef2ff 0%, #f5f3ff 50%, #faf5ff 100%)' }}>
            {/* Top bar — same height as ChatHeader so they align */}
            <div className="px-4 py-3 flex items-center" style={{ minHeight: '64px' }}>
                <div className="relative w-full">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-400" />
                    <input
                        value={search}
                        onChange={(e) => onSearchChange(e.target.value)}
                        placeholder="Search conversations..."
                        className="w-full pl-8 pr-3 py-2 text-sm bg-white/70 border border-indigo-100 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:border-transparent outline-none placeholder-indigo-300"
                    />
                </div>
            </div>

            {/* Thin separator */}
            <div className="h-px bg-indigo-100 mx-4" />

            <div className="flex-1 min-h-0 overflow-y-auto px-4 pt-3 pb-4 space-y-4">
                {children}
            </div>
        </aside>
    );
};

export default ChatSidebar;
