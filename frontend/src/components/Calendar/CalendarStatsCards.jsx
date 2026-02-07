import { CalendarDays, Clock, Flag, Users } from 'lucide-react';

const CalendarStatsCards = ({ stats }) => {
    const statItems = [
        { label: "Today's Events", value: stats.todayEvents.length, icon: CalendarDays, color: '#3B82F6' },
        { label: 'Upcoming', value: stats.upcoming.length, icon: Clock, color: '#8B5CF6' },
        { label: 'Deadlines', value: stats.deadlines.length, icon: Flag, color: '#EF4444' },
        { label: 'Meetings', value: stats.meetings.length, icon: Users, color: '#F59E0B' },
    ];

    return (
        <div className="grid grid-cols-4 gap-4 mb-6">
            {statItems.map((stat, i) => (
                <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center justify-between">
                    <div>
                        <p className="text-xs text-gray-500 font-medium">{stat.label}</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                    </div>
                    <div className="p-2.5 rounded-xl" style={{ backgroundColor: `${stat.color}10` }}>
                        <stat.icon size={20} style={{ color: stat.color }} />
                    </div>
                </div>
            ))}
        </div>
    );
};

export default CalendarStatsCards;
