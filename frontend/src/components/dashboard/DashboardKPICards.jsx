import { useNavigate } from 'react-router-dom';
import { FolderKanban, CheckSquare, AlertTriangle, Users } from 'lucide-react';

const cardConfig = [
    {
        key: 'projects',
        label: 'Projects',
        icon: FolderKanban,
        valueKey: 'totalProjects',
        subKey: 'activeProjects',
        subLabel: 'Active',
        color: 'text-indigo-600 bg-indigo-50',
        route: '/projects',
    },
    {
        key: 'tasks',
        label: 'Open Tasks',
        icon: CheckSquare,
        valueKey: 'openTasks',
        subKey: 'completedTasks',
        subLabel: 'Completed',
        color: 'text-blue-600 bg-blue-50',
        route: '/tasks',
    },
    {
        key: 'overdue',
        label: 'Overdue',
        icon: AlertTriangle,
        valueKey: 'overdueTasks',
        subKey: 'dueThisWeek',
        subLabel: 'Due this week',
        color: 'text-red-600 bg-red-50',
        route: '/tasks',
    },
    {
        key: 'members',
        label: 'Members',
        icon: Users,
        valueKey: 'totalMembers',
        subKey: 'adminCount',
        subLabel: 'Admins',
        color: 'text-emerald-600 bg-emerald-50',
        route: '/members',
    },
];

const DashboardKPICards = ({ stats }) => {
    const navigate = useNavigate();

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {cardConfig.map((card) => {
                const Icon = card.icon;
                return (
                    <button
                        key={card.key}
                        onClick={() => navigate(card.route)}
                        className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm hover:shadow-md hover:border-gray-200 transition-all text-left group"
                    >
                        <div className="flex items-center justify-between mb-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${card.color}`}>
                                <Icon size={18} />
                            </div>
                            <span className="text-2xl font-bold text-gray-900">{stats[card.valueKey] ?? 0}</span>
                        </div>
                        <p className="text-sm font-semibold text-gray-700">{card.label}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                            {card.subLabel}: {stats[card.subKey] ?? 0}
                        </p>
                    </button>
                );
            })}
        </div>
    );
};

export default DashboardKPICards;
