import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { Grid, Plus, Users } from 'lucide-react';
import useWorkspaceStore from '../store/useWorkspaceStore';
import PageSkeleton from '../components/common/PageSkeleton';

const WorkspaceList = () => {
    const navigate = useNavigate();
    const { workspaces, setWorkspaces, setCurrentWorkspaceId } = useWorkspaceStore();
    const [loading, setLoading] = useState(true);

    const sortedWorkspaces = useMemo(
        () => [...workspaces].sort((a, b) => a.name.localeCompare(b.name)),
        [workspaces]
    );

    const fetchWorkspaces = useCallback(async () => {
        try {
            const res = await api.get('/api/workspaces');
            setWorkspaces(res.data);
        } catch (err) {
            console.error('Failed to fetch workspaces', err);
        } finally {
            setLoading(false);
        }
    }, [setWorkspaces]);

    useEffect(() => {
        fetchWorkspaces();
    }, [fetchWorkspaces]);

    const handleSelectWorkspace = async (workspaceId) => {
        setCurrentWorkspaceId(workspaceId);
        navigate('/projects');
    };

    const workspaceColor = (ws) => ws.color || '#F97316';

    const formatCreatedAt = (ws) => {
        if (!ws?.createdAt) return '';
        return new Date(ws.createdAt).toLocaleString(undefined, {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
        });
    };

    if (loading) {
        return <PageSkeleton kind="workspaceList" />;
    }

    return (
        <div className="px-8 py-10">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-xl font-semibold text-gray-900">Workspaces</h1>
            </div>

            {sortedWorkspaces.length === 0 ? (
                <div className="rounded-lg bg-white shadow-md px-10 py-16 flex flex-col items-center justify-center text-center text-gray-600">
                    <div className="w-12 h-12 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 mb-3">
                        <Grid size={22} />
                    </div>
                    <div className="text-sm text-gray-700 font-medium">No workspaces found</div>
                    <p className="text-xs text-gray-500 mt-1">Create a new workspace to get started</p>
                </div>
            ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {sortedWorkspaces.map((ws) => (
                        <button
                            key={ws._id}
                            onClick={() => handleSelectWorkspace(ws._id)}
                            className="p-4 rounded-lg bg-white text-left hover:shadow-lg transition shadow-md"
                        >
                            <div className="flex items-start gap-3">
                                <div
                                    className="w-9 h-9 rounded-md flex items-center justify-center text-white text-sm font-semibold"
                                    style={{ backgroundColor: workspaceColor(ws) }}
                                >
                                    {ws.name.substring(0, 1).toUpperCase()}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="font-semibold text-gray-900 text-sm">{ws.name}</div>
                                        <div className="text-[11px] text-gray-400 flex items-center gap-1">
                                            <Users size={12} />
                                            <span>{ws.members?.length || 0}</span>
                                        </div>
                                    </div>
                                    <div className="text-[11px] text-gray-500">Created at {formatCreatedAt(ws)}</div>
                                    <p className="text-xs text-gray-600 mt-2 line-clamp-2">{ws.description || 'No description'}</p>
                                    <p className="text-[11px] text-gray-400 mt-2">View workspace details and projects</p>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default WorkspaceList;
