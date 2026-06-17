import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { Plus, Sparkles } from 'lucide-react';
import { toast } from 'react-hot-toast';
import useWorkspaceStore from '../store/useWorkspaceStore';
import useAuthStore from '../store/useAuthStore';
import CreateProjectModal from '../components/modals/CreateProjectModal';
import ConfirmModal from '../components/modals/ConfirmModal';
import ProjectStatsCards from '../components/workspace/ProjectStatsCards';
import ProjectFilters from '../components/workspace/ProjectFilters';
import ProjectCard from '../components/workspace/ProjectCard';
import EmptyProjectsState from '../components/workspace/EmptyProjectsState';
import { useWorkspaceProjects } from '../hooks/useWorkspaceProjects';
import { normalizeStatus, calculateProjectStats } from '../utils/projectHelpers';
import { emitProjectDataChanged } from '../utils/projectEvents';
import { WORKSPACE_PLAN, WORKSPACE_PLAN_FEATURES, normalizeWorkspacePlan } from '../constants/workspacePlans';
import { showUpgradeToProPrompt } from '../utils/upgradePrompts';
import PageSkeleton from '../components/common/PageSkeleton';
import AiProjectGeneratorModal from '../components/ai/AiProjectGeneratorModal';

const WorkspaceDetail = () => {
    const { workspaceId } = useParams();
    const navigate = useNavigate();
    const { currentWorkspaceId, setCurrentWorkspaceId, setSelectedWorkspace } = useWorkspaceStore();
    const { userInfo } = useAuthStore();

    const [showProjectModal, setShowProjectModal] = useState(false);
    const [editingProject, setEditingProject] = useState(null);
    const [search, setSearch] = useState('');
    const [activeFilter, setActiveFilter] = useState('All');
    const [openMenuProjectId, setOpenMenuProjectId] = useState(null);
    const [projectToDelete, setProjectToDelete] = useState(null);
    const [deletingProject, setDeletingProject] = useState(false);
    const [showAiModal, setShowAiModal] = useState(false);

    const effectiveWorkspaceId = workspaceId || currentWorkspaceId;

    const { workspace, projects, enrichedProjects, loading, fetchWorkspaceDetails } = useWorkspaceProjects(
        effectiveWorkspaceId,
        setSelectedWorkspace
    );

    useEffect(() => {
        if (workspaceId && workspaceId !== currentWorkspaceId) {
            setCurrentWorkspaceId(workspaceId);
        }
    }, [workspaceId, currentWorkspaceId, setCurrentWorkspaceId]);

    const myRole = workspace?.members?.find((m) => m.user?._id === userInfo?._id)?.role;
    const isAdminOrOwner = myRole === 'owner' || myRole === 'admin';
    const currentPlan = normalizeWorkspacePlan(workspace?.settings?.billing?.currentPlan);
    const planFeatures = WORKSPACE_PLAN_FEATURES[currentPlan] || WORKSPACE_PLAN_FEATURES[WORKSPACE_PLAN.FREE];
    const projectLimitReached =
        planFeatures.maxProjects !== null && projects.length >= planFeatures.maxProjects;

    const openUpgradePrompt = useCallback((message) => {
        showUpgradeToProPrompt({
            message,
            onUpgrade: () => navigate('/settings'),
            ctaLabel: 'Upgrade to Pro',
        });
    }, [navigate]);

    const handleCreateProjectClick = useCallback(() => {
        if (projectLimitReached) {
            openUpgradePrompt(`Free plan allows up to ${planFeatures.maxProjects} projects.`);
            return;
        }
        setShowProjectModal(true);
    }, [openUpgradePrompt, planFeatures.maxProjects, projectLimitReached]);

    const stats = useMemo(() => calculateProjectStats(enrichedProjects), [enrichedProjects]);

    const visibleProjects = useMemo(() => {
        const term = search.trim().toLowerCase();

        return enrichedProjects.filter((project) => {
            const statusKey = normalizeStatus(project.status);
            const statusMatch =
                activeFilter === 'All' ||
                (activeFilter === 'Active' && statusKey === 'active') ||
                (activeFilter === 'Planning' && statusKey === 'planning') ||
                (activeFilter === 'Completed' && statusKey === 'completed');

            if (!statusMatch) return false;
            if (!term) return true;

            const name = String(project.name || '').toLowerCase();
            const description = String(project.description || '').toLowerCase();
            return name.includes(term) || description.includes(term);
        });
    }, [enrichedProjects, search, activeFilter]);

    const handleCloseModal = useCallback(() => {
        setShowProjectModal(false);
        setEditingProject(null);
    }, []);

    const handlers = {
        projectClick: (projectId) => navigate(`/projects/${projectId}`),
        
        menuToggle: (projectId) => {
            setOpenMenuProjectId((prev) => (prev === projectId ? null : projectId));
        },
        
        edit: (projectId) => {
            setOpenMenuProjectId(null);
            const projectToEdit = enrichedProjects.find(p => p._id === projectId);
            if (projectToEdit) {
                setEditingProject(projectToEdit);
                setShowProjectModal(true);
            }
        },
        
        delete: (project) => {
            setOpenMenuProjectId(null);
            if (isAdminOrOwner) setProjectToDelete(project);
        },
        
        settings: () => {
            setOpenMenuProjectId(null);
            toast('Project settings coming soon');
        },
        
        confirmDelete: async () => {
            if (!projectToDelete) return;
            setDeletingProject(true);

            try {
                await axios.delete(`/api/projects/${projectToDelete._id}`);
                toast.success('Project deleted');
                emitProjectDataChanged({
                    workspaceId: effectiveWorkspaceId,
                    projectId: projectToDelete?._id,
                    source: 'workspace-detail-delete-project',
                });
                setProjectToDelete(null);
                fetchWorkspaceDetails();
            } catch (err) {
                toast.error(err?.response?.data?.message || 'Failed to delete project');
            } finally {
                setDeletingProject(false);
            }
        },
    };

    if (!effectiveWorkspaceId) {
        return (
            <div className="px-8 py-10">
                <div className="text-center text-gray-500">Select a workspace to view projects.</div>
            </div>
        );
    }

    if (loading) {
        return <PageSkeleton kind="workspace" />;
    }

    return (
        <div className="px-8 py-10" onClick={() => setOpenMenuProjectId(null)}>
            <div className="flex items-start justify-between mb-6 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
                    <p className="text-sm text-gray-500 mt-1">Manage and track all your projects</p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowAiModal(true)}
                        className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-violet-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:from-indigo-600 hover:to-violet-700 transition shadow-sm shadow-indigo-200"
                    >
                        <Sparkles size={16} />
                        Create with AI
                    </button>
                    <button
                        onClick={handleCreateProjectClick}
                        className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition"
                    >
                        <Plus size={16} />
                        New Project
                    </button>
                </div>
            </div>

            {projectLimitReached && (
                <p className="mb-4 text-sm text-amber-700">
                    Free plan allows up to {planFeatures.maxProjects} projects.
                </p>
            )}

            <ProjectStatsCards stats={stats} />

            <ProjectFilters
                search={search}
                onSearchChange={setSearch}
                activeFilter={activeFilter}
                onFilterChange={setActiveFilter}
            />

            {projects.length === 0 || visibleProjects.length === 0 ? (
                <EmptyProjectsState
                    hasProjects={projects.length > 0}
                    onCreateProject={handleCreateProjectClick}
                />
            ) : (
                <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {visibleProjects.map((project) => {
                        const isCreator = String(project.createdBy || '') === String(userInfo?._id || '');
                        const canEdit = isAdminOrOwner || isCreator;

                        return (
                            <ProjectCard
                                key={project._id}
                                project={project}
                                showMenu={canEdit}
                                isMenuOpen={openMenuProjectId === project._id}
                                onProjectClick={handlers.projectClick}
                                onMenuToggle={handlers.menuToggle}
                                onEdit={handlers.edit}
                                onDelete={handlers.delete}
                                onSettings={handlers.settings}
                            />
                        );
                    })}
                </div>
            )}

            {showProjectModal && workspace && (
                <CreateProjectModal
                    isOpen={showProjectModal}
                    onClose={handleCloseModal}
                    workspaceId={workspace._id}
                    onCreated={fetchWorkspaceDetails}
                    members={workspace.members || []}
                    mode={editingProject ? 'edit' : 'create'}
                    project={editingProject}
                />
            )}

            <ConfirmModal
                isOpen={!!projectToDelete}
                title="Delete Project"
                message={`Delete project "${projectToDelete?.name || ''}"? This action cannot be undone.`}
                confirmText="Delete"
                cancelText="Cancel"
                variant="danger"
                loading={deletingProject}
                onClose={() => !deletingProject && setProjectToDelete(null)}
                onConfirm={handlers.confirmDelete}
            />

            <AiProjectGeneratorModal
                isOpen={showAiModal}
                onClose={() => setShowAiModal(false)}
                workspaceId={effectiveWorkspaceId}
                onCreated={fetchWorkspaceDetails}
            />
        </div>
    );
};

export default WorkspaceDetail;
