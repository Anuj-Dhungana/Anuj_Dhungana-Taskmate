import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Layout, Calendar as CalendarIcon } from 'lucide-react';
import BoardView from '../components/board/BoardView';
import ProjectCalendar from '../components/calendar/ProjectCalendar';

const ProjectView = () => {
    const { projectId } = useParams();
    const navigate = useNavigate();
    const [project, setProject] = useState(null);
    const [viewMode, setViewMode] = useState('board');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProject = async () => {
            try {
                // We need to fetch the project details
                // Since we don't have a direct project endpoint, we'll get it from the board
                const res = await axios.get(`/api/board/${projectId}`);
                // For now, we'll create a minimal project object
                // In production, you'd have a dedicated endpoint
                setProject({ _id: projectId, name: 'Project' });
            } catch (err) {
                console.error('Failed to load project', err);
            } finally {
                setLoading(false);
            }
        };

        fetchProject();
    }, [projectId]);

    const handleBack = () => {
        navigate(-1); // Go back to previous page
    };

    if (loading) {
        return (
            <div className="px-8 py-10">
                <div className="flex items-center justify-center py-20">
                    <div className="text-gray-500">Loading project...</div>
                </div>
            </div>
        );
    }

    if (!project) {
        return (
            <div className="px-8 py-10">
                <div className="text-center text-gray-500">Project not found</div>
            </div>
        );
    }

    return (
        <div className="px-8 py-10">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleBack}
                        className="inline-flex items-center gap-2 text-gray-600 hover:text-blue-600 text-sm"
                    >
                        <ArrowLeft size={16} />
                        Back to projects
                    </button>
                    <div>
                        <p className="text-xs text-gray-500">Project</p>
                        <h2 className="text-lg font-semibold text-gray-900">{project.name}</h2>
                    </div>
                </div>

                <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
                    <button
                        onClick={() => setViewMode('board')}
                        className={`px-3 py-1 text-xs font-semibold rounded-md transition ${
                            viewMode === 'board' ? 'bg-white shadow text-blue-600' : 'text-gray-600 hover:text-gray-800'
                        }`}
                    >
                        <div className="flex items-center gap-1">
                            <Layout size={14} /> Board
                        </div>
                    </button>
                    <button
                        onClick={() => setViewMode('calendar')}
                        className={`px-3 py-1 text-xs font-semibold rounded-md transition ${
                            viewMode === 'calendar' ? 'bg-white shadow text-blue-600' : 'text-gray-600 hover:text-gray-800'
                        }`}
                    >
                        <div className="flex items-center gap-1">
                            <CalendarIcon size={14} /> Calendar
                        </div>
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-2 min-h-125">
                {viewMode === 'board' ? (
                    <div className="h-full">
                        <BoardView
                            projectId={projectId}
                            project={project}
                            onBack={handleBack}
                        />
                    </div>
                ) : (
                    <div className="h-full">
                        <ProjectCalendar projectId={projectId} />
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProjectView;
