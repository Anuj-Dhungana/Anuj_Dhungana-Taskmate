import { Outlet } from 'react-router-dom';
import { useDashboard } from '../hooks/useDashboard';
import DashboardSidebar from '../components/layout/DashboardSidebar';
import TopBar from '../components/layout/TopBar';
import CreateWorkspaceModal from '../components/modals/CreateWorkspaceModal';

const DashboardLayout = () => {
    const {
        userInfo,
        workspaces,
        currentWorkspace,
        currentWorkspaceId,
        myRole,
        isCollapsed,
        setIsCollapsed,
        showWorkspaceModal,
        setShowWorkspaceModal,
        workspaceMenuOpen,
        setWorkspaceMenuOpen,
        handleWorkspaceSelect,
        handleWorkspaceCreated,
    } = useDashboard();

    const workspaceProps = {
        currentWorkspace,
        workspaces,
        currentWorkspaceId,
        myRole,
        workspaceMenuOpen,
        onToggleMenu: () => setWorkspaceMenuOpen((v) => !v),
        onSelectWorkspace: handleWorkspaceSelect,
        onCreateWorkspace: () => {
            setWorkspaceMenuOpen(false);
            setShowWorkspaceModal(true);
        },
    };

    return (
        <div className="h-screen overflow-hidden bg-gray-50 flex">
            <DashboardSidebar
                isCollapsed={isCollapsed}
                onToggleCollapse={() => setIsCollapsed((v) => !v)}
                workspaceProps={workspaceProps}
                userInfo={userInfo}
            />

            <div className="flex-1 flex flex-col min-w-0">
                <TopBar />

                <main className="flex-1 overflow-y-auto bg-gray-50">
                    <Outlet />
                </main>

                {showWorkspaceModal && (
                    <CreateWorkspaceModal
                        onClose={() => setShowWorkspaceModal(false)}
                        onCreated={handleWorkspaceCreated}
                    />
                )}
            </div>
        </div>
    );
};

export default DashboardLayout;
