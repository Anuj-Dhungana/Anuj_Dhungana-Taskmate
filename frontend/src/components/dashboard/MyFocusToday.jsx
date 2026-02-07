import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Circle, ArrowRight } from 'lucide-react';
import { formatShortDate, isOverdue, isDueToday, getPriorityColor } from '../../utils/dashboardHelpers';

const MyFocusToday = ({ tasks, onCreateTask }) => {
    const navigate = useNavigate();

    if (tasks.length === 0) {
        return (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                <h2 className="text-base font-bold text-gray-900 mb-4">My Focus Today</h2>
                <div className="text-center py-10">
                    <div className="text-3xl mb-2">🎉</div>
                    <p className="text-sm font-semibold text-gray-700">You're all caught up!</p>
                    <p className="text-xs text-gray-400 mt-1 mb-4">No tasks due today or overdue</p>
                    <button
                        onClick={onCreateTask}
                        className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition"
                    >
                        Create Task
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-gray-900">My Focus Today</h2>
                <button
                    onClick={() => navigate('/tasks')}
                    className="text-xs text-indigo-600 font-semibold flex items-center gap-1 hover:text-indigo-700"
                >
                    All tasks <ArrowRight size={14} />
                </button>
            </div>

            <div className="space-y-2">
                {tasks.map((task) => {
                    const overdue = isOverdue(task.dueDate);
                    const dueToday = isDueToday(task.dueDate);

                    return (
                        <div
                            key={task._id}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-gray-100 hover:border-indigo-200 hover:bg-gray-50 transition-all group cursor-pointer"
                            onClick={() => navigate(`/projects/${task.projectId?._id || task.projectId}`)}
                        >
                            {/* Priority dot */}
                            <div className={`w-2 h-2 rounded-full shrink-0 ${getPriorityColor(task.priority)}`} title={task.priority} />

                            {/* Task icon */}
                            <Circle size={16} className="text-gray-300 shrink-0" />

                            {/* Task info */}
                            <div className="flex-1 min-w-0">
                                <p className="text-sm text-gray-800 font-medium truncate">{task.title}</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                    {task.projectId?.name && (
                                        <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-medium">
                                            {task.projectId.name}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Due date */}
                            {task.dueDate && (
                                <span
                                    className={`text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                                        overdue
                                            ? 'bg-red-50 text-red-600'
                                            : dueToday
                                              ? 'bg-amber-50 text-amber-600'
                                              : 'text-gray-400'
                                    }`}
                                >
                                    {overdue ? 'Overdue' : dueToday ? 'Today' : formatShortDate(task.dueDate)}
                                </span>
                            )}

                            <ArrowRight size={14} className="text-gray-300 group-hover:text-indigo-500 shrink-0 transition" />
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default MyFocusToday;
