import { Search } from 'lucide-react';

const ChatSidebar = ({ search, onSearchChange, children }) => {
    return (
        <aside className="w-72 border-r bg-gray-50/80 p-4 flex flex-col">
            <div className="relative mb-4">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                    value={search}
                    onChange={(e) => onSearchChange(e.target.value)}
                    placeholder="Search conversations..."
                    className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                />
            </div>

            <div className="flex-1 overflow-y-auto pr-1 space-y-4">
                {children}
            </div>
        </aside>
    );
};

export default ChatSidebar;
