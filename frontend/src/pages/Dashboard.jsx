import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDashboardData } from '../hooks/useDashboardData';
import DashboardKPICards from '../components/dashboard/DashboardKPICards';
import RecentProjects from '../components/dashboard/RecentProjects';
import MyFocusToday from '../components/dashboard/MyFocusToday';
import UpcomingEvents from '../components/dashboard/UpcomingEvents';
import ActivityFeed from '../components/dashboard/ActivityFeed';
import NewActionDropdown from '../components/dashboard/NewActionDropdown';
import CreateProjectModal from '../components/modals/CreateProjectModal';
import InviteUserModal from '../components/modals/InviteUserModal';
import { WORKSPACE_PLAN, WORKSPACE_PLAN_FEATURES, normalizeWorkspacePlan } from '../constants/workspacePlans';
import { showUpgradeToProPrompt } from '../utils/upgradePrompts';
import PageSkeleton from '../components/common/PageSkeleton';

const Dashboard = () => {
    const navigate = useNavigate();
    const {
        loading,
        currentWorkspaceId,
        workspace,
        members,
        canInvite,
        stats,
        recentProjects,
        focusTasks,
        upcomingEvents,
        activityFeed,
        projects,
        refreshData,
    } = useDashboardData();

    const [showCreateProject, setShowCreateProject] = useState(false);
    const [showInviteModal, setShowInviteModal] = useState(false);

    const workspaceName = workspace?.name || 'Workspace';
    const currentPlan = normalizeWorkspacePlan(workspace?.settings?.billing?.currentPlan);
    const planFeatures = WORKSPACE_PLAN_FEATURES[currentPlan] || WORKSPACE_PLAN_FEATURES[WORKSPACE_PLAN.FREE];
    const projectLimitReached =
        planFeatures.maxProjects !== null && projects.length >= planFeatures.maxProjects;
    const memberLimitReached =
        planFeatures.maxMembers !== null && members.length >= planFeatures.maxMembers;

    const openUpgradePrompt = (message) =>
        showUpgradeToProPrompt({
            message,
            onUpgrade: () => navigate('/settings'),
            ctaLabel: 'Upgrade to Pro',
        });

    const handleCreateProject = () => {
        if (projectLimitReached) {
            openUpgradePrompt(`Free plan allows up to ${planFeatures.maxProjects} projects.`);
            return;
        }
        setShowCreateProject(true);
    };

    const handleInviteMember = () => {
        if (!canInvite) return;
        if (memberLimitReached) {
            openUpgradePrompt('Upgrade to Pro to add more members.');
            return;
        }
        setShowInviteModal(true);
    };

    if (!currentWorkspaceId) {
        return (
            <div className="px-8 py-10">
                <div className="text-center text-gray-500 mt-20">
                    <p className="text-lg font-semibold text-gray-700">No workspace selected</p>
                    <p className="text-sm mt-1">Select a workspace from the sidebar to view your dashboard.</p>
                </div>
            </div>
        );
    }

    if (loading) {
        return <PageSkeleton kind="dashboard" />;
    }

    return (
        <div className="px-8 py-8 min-h-screen bg-gray-50/50">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                    <p className="text-sm text-gray-400 mt-0.5">
                        Workspace overview &bull; {workspaceName}
                    </p>
                </div>
                <NewActionDropdown
                    canInvite={canInvite}
                    onCreateProject={handleCreateProject}
                    onCreateTask={() => navigate('/tasks')}
                    onInviteMember={handleInviteMember}
                />
            </div>

            {/* KPI Cards */}
            <DashboardKPICards stats={stats} />

            {/* Main 70/30 Layout */}
            <div className="flex gap-6">
                {/* LEFT — 70% Work overview */}
                <div className="flex-1 min-w-0 space-y-6">
                    <RecentProjects
                        projects={recentProjects}
                        onCreateProject={handleCreateProject}
                    />

                    <MyFocusToday
                        tasks={focusTasks}
                        onCreateTask={() => navigate('/tasks')}
                    />
                </div>

                {/* RIGHT — 30% Timeline & Activity */}
                <div className="w-80 shrink-0 space-y-6 hidden lg:block">
                    <UpcomingEvents grouped={upcomingEvents} />
                    <ActivityFeed activities={activityFeed} />
                </div>
            </div>

            {/* Modals */}
            {showCreateProject && (
                <CreateProjectModal
                    isOpen={showCreateProject}
                    onClose={() => setShowCreateProject(false)}
                    workspaceId={currentWorkspaceId}
                    members={members}
                    onCreated={() => {
                        setShowCreateProject(false);
                        refreshData();
                    }}
                />
            )}

            {showInviteModal && (
                <InviteUserModal
                    isOpen={showInviteModal}
                    onClose={() => {
                        setShowInviteModal(false);
                        refreshData();
                    }}
                    workspaceId={currentWorkspaceId}
                    defaultRole={workspace?.settings?.access?.defaultInviteRole || 'member'}
                />
            )}
        </div>
    );
};

export default Dashboard;
