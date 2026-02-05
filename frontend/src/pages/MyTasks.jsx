import { useEffect, useState } from 'react';
import axios from 'axios';
import useWorkspaceStore from '../store/userWorkspaceStore';

const MyTasks = () => {
    const { currentWorkspaceId } = useWorkspaceStore();
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTasks = async () => {
            if (!currentWorkspaceId) return;
            setLoading(true);
            setTasks([]);
            try {
                const res = await axios.get(`/api/board/my-tasks?workspaceId=${currentWorkspaceId}`);
                setTasks(res.data || []);
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
                <div className="space-y-3">
                    {tasks.map((task) => (
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
    );
};

export default MyTasks;
