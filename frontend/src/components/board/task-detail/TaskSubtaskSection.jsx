import { CheckSquare, Plus, Trash2, Sparkles } from 'lucide-react';

const TaskSubtaskSection = ({
    subtasks,
    canEditTask,
    newSubtask,
    setNewSubtask,
    onAdd,
    onToggle,
    onDelete,
    submitting,
    completedCount,
    onBreakDown,
}) => {
    return (
        <section className="rounded-xl border border-gray-100 bg-white">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <CheckSquare size={16} className="text-gray-500" />
                    <h3 className="text-sm font-semibold text-gray-800">Subtasks</h3>
                    <span className="text-xs text-gray-500">
                        {completedCount}/{subtasks.length}
                    </span>
                </div>
                {canEditTask && onBreakDown && (
                    <button
                        type="button"
                        onClick={onBreakDown}
                        className="flex items-center gap-1.5 text-xs font-semibold text-violet-600 hover:text-violet-700 bg-violet-50 hover:bg-violet-100 px-2.5 py-1.5 rounded-lg transition"
                        title="Use AI to break down this task into subtasks"
                    >
                        <Sparkles size={12} />
                        Break Down Task
                    </button>
                )}
            </div>
            <div className="p-4 space-y-2">
                {subtasks.map((subtask) => (
                    <div
                        key={subtask._id}
                        className={`flex items-center gap-2 px-2 py-1.5 rounded-md ${
                            canEditTask ? 'hover:bg-gray-50 cursor-pointer' : 'opacity-70'
                        }`}
                    >
                        <input
                            type="checkbox"
                            checked={!!subtask.done}
                            onChange={(event) => onToggle(subtask._id, event.target.checked)}
                            disabled={!canEditTask}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span
                            className={`text-sm ${
                                subtask.done ? 'text-gray-400 line-through' : 'text-gray-700'
                            }`}
                        >
                            {subtask.text}
                        </span>
                        {canEditTask && (
                            <button
                                type="button"
                                onClick={() => onDelete(subtask._id)}
                                className="ml-auto p-1 rounded text-red-400 hover:text-red-600 hover:bg-red-50"
                                title="Delete subtask"
                            >
                                <Trash2 size={14} />
                            </button>
                        )}
                    </div>
                ))}
                {subtasks.length === 0 && <p className="text-sm text-gray-400">No subtasks yet.</p>}
                <div className="pt-2 flex items-center gap-2">
                    <input
                        value={newSubtask}
                        onChange={(event) => setNewSubtask(event.target.value)}
                        onKeyDown={(event) => {
                            if (event.key === 'Enter') {
                                event.preventDefault();
                                onAdd();
                            }
                        }}
                        disabled={!canEditTask}
                        placeholder="Add subtask"
                        className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-400"
                    />
                    <button
                        onClick={onAdd}
                        disabled={!canEditTask || submitting}
                        className="inline-flex items-center gap-1 px-3 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
                    >
                        <Plus size={14} />
                        Add
                    </button>
                </div>
            </div>
        </section>
    );
};

export default TaskSubtaskSection;
