import { Target } from 'lucide-react';
import { getDueMeta, toPriority } from '../../utils/taskHelpers';

/**
 * FocusTodaySection — renders the "Focus Today" horizontal-scroll card strip.
 *
 * Props:
 *   tasks      {Task[]}             up to 3 prioritised tasks
 *   onOpenTask {(task: Task) => void}
 */
const FocusTodaySection = ({ tasks, onOpenTask }) => (
    <section className="rounded-2xl border border-gray-200 bg-white p-4 mb-6">
        <div className="flex items-center gap-2 mb-3">
            <Target size={16} className="text-violet-600" />
            <h2 className="text-sm font-semibold text-gray-900">Focus Today</h2>
        </div>

        {tasks.length === 0 ? (
            <p className="text-sm text-gray-400">No urgent tasks right now.</p>
        ) : (
            <div className="flex gap-3 overflow-x-auto pb-1">
                {tasks.map((task) => {
                    const dueMeta = getDueMeta(task);
                    const priority = toPriority(task.priority);
                    const badgeClass = dueMeta.tone.includes('red')
                        ? 'bg-red-100 text-red-700'
                        : dueMeta.tone.includes('amber')
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-gray-100 text-gray-600';
                    const dotClass =
                        priority === 'High'
                            ? 'bg-red-500'
                            : priority === 'Medium'
                              ? 'bg-amber-500'
                              : 'bg-gray-400';

                    return (
                        <button
                            key={task._id}
                            type="button"
                            onClick={() => onOpenTask(task)}
                            className="min-w-57.5 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-left hover:border-blue-300 hover:bg-blue-50/40 transition"
                        >
                            <p className="text-sm font-semibold text-gray-900 line-clamp-1">{task.title}</p>
                            <div className="mt-1 flex items-center justify-between text-xs">
                                <span className={`px-2 py-0.5 rounded-full ${badgeClass}`}>{dueMeta.text}</span>
                                <span className="inline-flex items-center gap-1 text-gray-500">
                                    <span className={`w-2 h-2 rounded-full ${dotClass}`} />
                                    {priority}
                                </span>
                            </div>
                        </button>
                    );
                })}
            </div>
        )}
    </section>
);

export default FocusTodaySection;
