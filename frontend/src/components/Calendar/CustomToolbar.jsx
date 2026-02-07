import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getToolbarLabel } from '../../utils/calendarHelpers';

const CustomToolbar = ({ date, onNavigate, view, onView }) => {
    const label = getToolbarLabel(date, view);

    return (
        <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
                <button
                    onClick={() => onNavigate('PREV')}
                    className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-500"
                >
                    <ChevronLeft size={18} />
                </button>
                <button
                    onClick={() => onNavigate('TODAY')}
                    className="px-3 py-1 text-xs font-medium rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600 transition-colors"
                >
                    Today
                </button>
                <button
                    onClick={() => onNavigate('NEXT')}
                    className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-500"
                >
                    <ChevronRight size={18} />
                </button>
                <h2 className="text-base font-semibold text-gray-800 ml-2">{label}</h2>
            </div>
            <div className="flex bg-gray-100 p-0.5 rounded-lg">
                {['day', 'week', 'month'].map(v => (
                    <button
                        key={v}
                        onClick={() => onView(v)}
                        className={`px-3 py-1 text-xs font-medium rounded-md capitalize transition-colors ${
                            view === v
                                ? 'bg-white text-indigo-600 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        {v}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default CustomToolbar;
