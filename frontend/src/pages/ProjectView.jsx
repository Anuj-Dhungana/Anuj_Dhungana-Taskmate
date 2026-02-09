import { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Layout, Calendar as CalendarIcon, Settings } from 'lucide-react';
import BoardView from '../components/board/BoardView';
import ProjectCalendar from '../components/calendar/ProjectCalendar';
import CreateProjectModal from '../components/modals/CreateProjectModal';
import { addProjectDataChangedListener } from '../utils/projectEvents';
import useAuthStore from '../store/useAuthStore';
import useWorkspaceStore from '../store/useWorkspaceStore';

const ProjectView = () => {
    const { projectId } = useParams();
    const navigate = useNavigate();
    const { userInfo } = useAuthStore();
    const { selectedWorkspace } = useWorkspaceStore();
    const [project, setProject] = useState(null);
    const [viewMode, setViewMode] = useState('board');
    const [loading, setLoading] = useState(true);
    const [showEditModal, setShowEditModal] = useState(false);

    const fetchProject = useCallback(async () => {
        try {
            const res = await axios.get(`/api/projects/${projectId}`);
            setProject(res.data);
        } catch (err) {
            console.error('Failed to load project', err);
        } finally {
            setLoading(false);
        }
    }, [projectId]);

    useEffect(() => {
        fetchProject();
    }, [fetchProject]);

    useEffect(() => {
        const unsubscribe = addProjectDataChangedListener((detail) => {
            if (detail?.projectId && String(detail.projectId) !== String(projectId)) return;
            fetchProject();
        });
        return unsubscribe;
    }, [fetchProject, projectId]);

    const handleBack = () => {
        navigate(-1); // Go back to previous page
    };

    const handleCloseEditModal = useCallback(() => {
        setShowEditModal(false);
    }, []);

    const handleProjectUpdated = useCallback(() => {
        fetchProject();
        setShowEditModal(false);
    }, [fetchProject]);

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

    // Check permissions
    const workspace = selectedWorkspace?.workspace;
    const myRole = workspace?.members?.find((m) => m.user?._id === userInfo?._id)?.role;
    const isAdminOrOwner = myRole === 'owner' || myRole === 'admin';

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

                <div className="flex items-center gap-3">
                    {isAdminOrOwner && (
                        <button
                            onClick={() => setShowEditModal(true)}
                            className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                            title="Edit project settings"
                        >
                            <Settings size={14} />
                            Edit Project
                        </button>
                    )}
                    
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

            {showEditModal && workspace && project && (
                <CreateProjectModal
                    isOpen={showEditModal}
                    onClose={handleCloseEditModal}
                    workspaceId={workspace._id}
                    onCreated={handleProjectUpdated}
                    members={workspace.members || []}
                    mode="edit"
                    project={project}
                />
            )}
        </div>
    );
};

export default ProjectView;
