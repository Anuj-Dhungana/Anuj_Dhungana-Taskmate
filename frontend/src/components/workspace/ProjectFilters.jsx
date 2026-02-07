import { Search } from 'lucide-react';

const FILTERS = ['All', 'Active', 'Planning', 'Completed'];

const ProjectFilters = ({ search, onSearchChange, activeFilter, onFilterChange }) => {
    return (
        <div className="rounded-xl border border-gray-200 bg-white p-3 mb-5 flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-xl">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                    value={search}
                    onChange={(e) => onSearchChange(e.target.value)}
                    placeholder="Search projects..."
                    className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
                {FILTERS.map((filter) => (
                    <button
                        key={filter}
                        onClick={() => onFilterChange(filter)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
                            activeFilter === filter
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                        }`}
                    >
                        {filter}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default ProjectFilters;
