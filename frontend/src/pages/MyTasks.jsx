import { useEffect, useState } from 'react';
import axios from 'axios';
import useWorkspaceStore from '../store/useWorkspaceStore';

const MyTasks = () => {
    const { currentWorkspaceId } = useWorkspaceStore();
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [grouped, setGrouped] = useState({ today: [], upcoming: [], overdue: [], noDate: [] });

    useEffect(() => {
        const fetchTasks = async () => {
            if (!currentWorkspaceId) return;
            setLoading(true);
            setTasks([]);
            try {
                const res = await axios.get(`/api/board/my-tasks?workspaceId=${currentWorkspaceId}`);
                const data = res.data || [];
                setTasks(data);

                const now = new Date();
                const todayStart = new Date(now);
                todayStart.setHours(0, 0, 0, 0);
                const todayEnd = new Date(now);
                todayEnd.setHours(23, 59, 59, 999);

                const buckets = { today: [], upcoming: [], overdue: [], noDate: [] };
                data.forEach((task) => {
                    if (!task.dueDate) {
                        buckets.noDate.push(task);
                        return;
                    }
                    const due = new Date(task.dueDate);
                    if (Number.isNaN(due.getTime())) {
                        buckets.noDate.push(task);
                        return;
                    }
                    if (due < todayStart) buckets.overdue.push(task);
                    else if (due <= todayEnd) buckets.today.push(task);
                    else buckets.upcoming.push(task);
                });
                setGrouped(buckets);
            } catch (err) {
                console.error('Failed to load tasks', err);
            } finally {
                setLoading(false);
            }
        };
        fetchTasks();
    }, [currentWorkspaceId]);

    if (!currentWorkspaceId) {
        return (
            <div className="px-8 py-10">
                <div className="text-center text-gray-500">Select a workspace to view your tasks.</div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="px-8 py-10">
                <div className="text-gray-500">Loading tasks...</div>
            </div>
        );
    }

    return (
        <div className="px-8 py-10">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">My Tasks</h1>
                <p className="text-gray-500 text-sm">Tasks assigned to you in this workspace.</p>
            </div>

            {tasks.length === 0 ? (
                <div className="bg-white rounded-lg shadow-md p-8 text-center text-gray-500">
                    No tasks assigned to you.
                </div>
            ) : (
                <div className="space-y-6">
                    {[
                        { key: 'today', label: 'Today', items: grouped.today },
                        { key: 'upcoming', label: 'Upcoming', items: grouped.upcoming },
                        { key: 'overdue', label: 'Overdue', items: grouped.overdue },
                    ].map((section) => (
                        <div key={section.key}>
                            <div className="flex items-center justify-between mb-2">
                                <h2 className="text-sm font-semibold text-gray-900">{section.label}</h2>
                                <span className="text-xs text-gray-400">{section.items.length} tasks</span>
                            </div>
                            {section.items.length === 0 ? (
                                <div className="bg-white rounded-lg border border-dashed p-4 text-sm text-gray-400">
                                    No tasks in this section.
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {section.items.map((task) => (
                                        <div key={task._id} className="bg-white rounded-lg shadow-sm border p-4 flex items-center justify-between">
                                            <div>
                                                <div className="text-sm font-semibold text-gray-900">{task.title}</div>
                                                <div className="text-xs text-gray-500 mt-1">
                                                    {task.projectId?.name ? `Project: ${task.projectId.name}` : 'Project'}
                                                    {task.listId?.title ? ` • ${task.listId.title}` : ''}
                                                </div>
                                            </div>
                                            {task.dueDate && (
                                                <div className="text-xs text-gray-500">
                                                    Due: {new Date(task.dueDate).toLocaleDateString()}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}

                    {grouped.noDate.length > 0 && (
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <h2 className="text-sm font-semibold text-gray-900">No Due Date</h2>
                                <span className="text-xs text-gray-400">{grouped.noDate.length} tasks</span>
                            </div>
                            <div className="space-y-3">
                                {grouped.noDate.map((task) => (
                                    <div key={task._id} className="bg-white rounded-lg shadow-sm border p-4 flex items-center justify-between">
                                        <div>
                                            <div className="text-sm font-semibold text-gray-900">{task.title}</div>
                                            <div className="text-xs text-gray-500 mt-1">
                                                {task.projectId?.name ? `Project: ${task.projectId.name}` : 'Project'}
                                                {task.listId?.title ? ` • ${task.listId.title}` : ''}
                                            </div>
                                        </div>
                                        <div className="text-xs text-gray-400">No due date</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default MyTasks;
