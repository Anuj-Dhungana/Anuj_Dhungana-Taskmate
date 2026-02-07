import { Users } from 'lucide-react';

const MemberStatsCards = ({ stats }) => {
    const statItems = [
        { label: 'Total Members', value: stats.totalMembers },
        { label: 'Active', value: stats.activeMembers },
        { label: 'Admins', value: stats.adminCount },
        { label: 'Total Tasks', value: stats.totalTasks },
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {statItems.map((stat) => (
                <div key={stat.label} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs text-gray-500 font-medium">{stat.label}</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400">
                            <Users size={18} />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default MemberStatsCards;
