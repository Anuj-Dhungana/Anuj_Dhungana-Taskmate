const base = 'animate-pulse bg-gray-200 rounded-xl';

const Block = ({ className = '' }) => <div className={`${base} ${className}`} />;

const SectionCard = ({ className = '' }) => (
    <div className={`rounded-2xl border border-gray-100 bg-white p-4 ${className}`}>
        <div className="space-y-3">
            <Block className="h-4 w-40" />
            <Block className="h-4 w-full" />
            <Block className="h-4 w-11/12" />
            <Block className="h-4 w-3/4" />
        </div>
    </div>
);

const HeaderSkeleton = ({ showAction = true }) => (
    <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
            <Block className="h-8 w-56" />
            <Block className="h-4 w-72" />
        </div>
        {showAction && <Block className="h-10 w-36 rounded-lg" />}
    </div>
);

const KPIRow = ({ count = 4 }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {Array.from({ length: count }).map((_, index) => (
            <SectionCard key={`kpi-${index}`} className="h-28" />
        ))}
    </div>
);

const DashboardSkeleton = () => (
    <div className="px-8 py-8 min-h-screen bg-gray-50/50 space-y-6">
        <HeaderSkeleton />
        <KPIRow count={4} />

        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_20rem] gap-6">
            <div className="space-y-6">
                <SectionCard className="h-64" />
                <SectionCard className="h-72" />
            </div>
            <div className="space-y-6 hidden lg:block">
                <SectionCard className="h-64" />
                <SectionCard className="h-64" />
            </div>
        </div>
    </div>
);

const WorkspaceDetailSkeleton = () => (
    <div className="px-8 py-10 space-y-6">
        <HeaderSkeleton />
        <KPIRow count={4} />

        <div className="rounded-2xl border border-gray-100 bg-white p-4">
            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4">
                <Block className="h-11 w-full rounded-lg" />
                <Block className="h-11 w-full md:w-52 rounded-lg" />
            </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, index) => (
                <SectionCard key={`project-card-${index}`} className="h-40" />
            ))}
        </div>
    </div>
);

const WorkspaceListSkeleton = () => (
    <div className="px-8 py-10 space-y-6">
        <HeaderSkeleton showAction={false} />
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, index) => (
                <SectionCard key={`workspace-${index}`} className="h-36" />
            ))}
        </div>
    </div>
);

const MembersSkeleton = () => (
    <div className="px-8 py-10 space-y-6">
        <HeaderSkeleton />
        <KPIRow count={4} />
        <SectionCard className="h-96" />
    </div>
);

const CalendarSkeleton = () => (
    <div className="px-8 py-8 min-h-screen bg-gray-50/30 space-y-6">
        <HeaderSkeleton showAction={false} />
        <KPIRow count={4} />

        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_20rem] gap-6">
            <SectionCard className="h-[62vh]" />
            <div className="space-y-5">
                <SectionCard className="h-52" />
                <SectionCard className="h-52" />
                <SectionCard className="h-40" />
            </div>
        </div>
    </div>
);

const ChatSkeleton = () => (
    <div className="h-full min-h-0 p-4">
        <div className="h-full min-h-[70vh] rounded-2xl border border-gray-100 bg-white p-3">
            <div className="h-full grid grid-cols-1 md:grid-cols-[17rem_minmax(0,1fr)] gap-3">
                <SectionCard className="h-full" />
                <SectionCard className="h-full" />
            </div>
        </div>
    </div>
);

const TasksSkeleton = () => (
    <div className="px-8 py-8 min-h-screen bg-gray-50/50 space-y-6">
        <HeaderSkeleton showAction={false} />
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, index) => (
                <SectionCard key={`task-kpi-${index}`} className="h-24" />
            ))}
        </div>
        <SectionCard className="h-44" />
        <SectionCard className="h-72" />
        <SectionCard className="h-72" />
    </div>
);

const ProjectSkeleton = () => (
    <div className="px-6 py-6 min-h-screen bg-gray-50/30 space-y-5">
        <HeaderSkeleton />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, index) => (
                <SectionCard key={`project-kpi-${index}`} className="h-40" />
            ))}
        </div>
        <SectionCard className="h-[62vh]" />
    </div>
);

const AnalyticsSkeleton = () => (
    <div className="min-h-screen bg-gray-50/80">
        <div className="px-6 lg:px-8 py-4 border-b border-gray-100 bg-white">
            <HeaderSkeleton />
        </div>

        <div className="px-6 lg:px-8 py-6 space-y-6">
            <KPIRow count={4} />
            <div className="flex gap-2">
                <Block className="h-10 w-36 rounded-lg" />
                <Block className="h-10 w-36 rounded-lg" />
                <Block className="h-10 w-36 rounded-lg" />
            </div>
            <SectionCard className="h-[58vh]" />
        </div>
    </div>
);

const CardSkeleton = ({ fullScreen = false }) => (
    <div className={fullScreen ? 'min-h-screen bg-gray-50 flex items-center justify-center p-4' : ''}>
        <div className="w-full max-w-xl rounded-2xl border border-gray-100 bg-white p-6 space-y-4">
            <Block className="h-7 w-44" />
            <Block className="h-4 w-64" />
            <SectionCard className="h-24" />
            <div className="flex gap-3">
                <Block className="h-10 w-36 rounded-lg" />
                <Block className="h-10 w-36 rounded-lg" />
            </div>
        </div>
    </div>
);

const InlinePanelSkeleton = () => (
    <div className="space-y-3 animate-pulse">
        <Block className="h-4 w-40" />
        <Block className="h-4 w-full" />
        <Block className="h-4 w-10/12" />
    </div>
);

const layoutMap = {
    dashboard: <DashboardSkeleton />,
    workspace: <WorkspaceDetailSkeleton />,
    workspaceList: <WorkspaceListSkeleton />,
    members: <MembersSkeleton />,
    calendar: <CalendarSkeleton />,
    chat: <ChatSkeleton />,
    tasks: <TasksSkeleton />,
    project: <ProjectSkeleton />,
    analytics: <AnalyticsSkeleton />,
    card: <CardSkeleton />,
    authCard: <CardSkeleton fullScreen />,
    inlinePanel: <InlinePanelSkeleton />,
};

const PageSkeleton = ({ kind = 'dashboard' }) => layoutMap[kind] || <DashboardSkeleton />;

export default PageSkeleton;