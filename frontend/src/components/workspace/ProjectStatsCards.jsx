import { CheckCircle2, Clock3, AlertCircle, Info } from 'lucide-react';

const ProjectStatsCards = ({ stats }) => {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            <div className="rounded-xl border border-gray-200 bg-white p-4">
                <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                    <span>Total Projects</span>
                    <CheckCircle2 size={16} className="text-blue-500" />
                </div>
                <div className="text-2xl font-bold text-gray-900">{stats.totalProjects}</div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-4">
                <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                    <span>Active</span>
                    <Clock3 size={16} className="text-green-500" />
                </div>
                <div className="text-2xl font-bold text-gray-900">{stats.active}</div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-4">
                <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                    <span>Completed</span>
                    <CheckCircle2 size={16} className="text-indigo-500" />
                </div>
                <div className="text-2xl font-bold text-gray-900">{stats.completed}</div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-4">
                <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                    <span
                        className="inline-flex items-center gap-1"
                        title="Projects with overdue tasks or past end date"
                    >
                        Behind Schedule
                        <Info size={12} className="text-gray-400" />
                    </span>
                    <AlertCircle size={16} className="text-red-500" />
                </div>
                <div className="text-2xl font-bold text-gray-900">{stats.behindSchedule}</div>
            </div>
        </div>
    );
};

export default ProjectStatsCards;
