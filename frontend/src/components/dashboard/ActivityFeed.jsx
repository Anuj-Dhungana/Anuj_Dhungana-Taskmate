import { timeAgo } from '../../utils/dashboardHelpers';

const ActivityFeed = ({ activities }) => {
    if (activities.length === 0) {
        return (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                <h2 className="text-sm font-bold text-gray-900 mb-4">Activity</h2>
                <p className="text-xs text-gray-400 text-center py-4">No recent activity</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h2 className="text-sm font-bold text-gray-900 mb-4">Activity</h2>
            <div className="space-y-3">
                {activities.map((item) => (
                    <div key={item._id} className="flex items-start gap-2.5">
                        {/* Avatar */}
                        <div className="w-7 h-7 rounded-full bg-linear-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                            {item.sender?.fullname?.charAt(0)?.toUpperCase() || '?'}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                            <p className="text-xs text-gray-700 leading-relaxed">
                                <span className="font-semibold">{item.sender?.fullname || 'Someone'}</span>{' '}
                                {item.message}
                            </p>
                            <p className="text-[10px] text-gray-400 mt-0.5">{timeAgo(item.createdAt)}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ActivityFeed;
