
import { AlertTriangle, CheckCircle2, ChevronDown, ChevronRight, Circle, Clock3, Search, X } from 'lucide-react';
import TaskDetailModal from '../components/board/task-detail/TaskDetailModal';
import FocusTodaySection from '../components/tasks/FocusTodaySection';
import KpiCard from '../components/tasks/KpiCard';
import MyTaskCard from '../components/tasks/MyTaskCard';
import useMyTasks from '../hooks/useMyTasks';
import Loader from '../components/common/Loader';

const SECTIONS = [
    { key: 'overdue', label: 'Overdue', empty: 'No overdue tasks', tone: 'text-red-600' },
    { key: 'dueSoon', label: 'Due Soon (Next 3 Days)', empty: 'No due soon tasks', tone: 'text-amber-600' },
    { key: 'upcoming', label: 'Upcoming', empty: 'No upcoming tasks', tone: 'text-blue-600' },
    { key: 'completed', label: 'Completed', empty: 'No completed tasks', tone: 'text-gray-600' },
];

const MyTasks = () => {
    const {
        currentWorkspaceId,
        userInfo,
        tasks,
        loading,
        searchQuery, setSearchQuery,
        projectFilter, setProjectFilter,
        priorityFilter, setPriorityFilter,
        hideCompleted, setHideCompleted,
        projectOptions,
        kpiCounts,
        focusTodayTasks,
        visibleTasks,
        groupedSections,
        activeKpi, handleKpiClick,
        sectionOpen, toggleSection,
        selectedTask, selectedProjectMembers,
        handleOpenTask, handleCloseTask,
        fetchTasks,
    } = useMyTasks();

    if (!currentWorkspaceId) {
        return (
            <div className="px-8 py-10">
                <div className="text-center text-gray-500">Select a workspace to view your tasks.</div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="px-8 py-10 flex justify-center">
                <Loader />
            </div>
        );
    }

    return (
        <div className="px-8 py-8 min-h-screen bg-gray-50/50">
            {/* ── Header + Filters ── */}
            <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">My Tasks</h1>
                    <p className="text-sm text-gray-500 mt-1">Tasks assigned to you in this workspace</p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <div className="relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search tasks..."
                            className="w-72 pl-9 pr-9 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                                title="Clear search"
                            >
                                <X size={12} />
                            </button>
                        )}
                    </div>

                    <select
                        value={projectFilter}
                        onChange={(e) => setProjectFilter(e.target.value)}
                        className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    >
                        <option value="all">All Projects</option>
                        {projectOptions.map(([id, name]) => (
                            <option key={id} value={id}>{name}</option>
                        ))}
                    </select>

                    <select
                        value={priorityFilter}
                        onChange={(e) => setPriorityFilter(e.target.value)}
                        className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    >
                        {['All', 'High', 'Medium', 'Low'].map((opt) => (
                            <option key={opt} value={opt}>{opt} Priority</option>
                        ))}
                    </select>

                    <button
                        onClick={() => setHideCompleted((prev) => !prev)}
                        className={`px-3 py-2 text-sm rounded-lg border transition ${
                            hideCompleted
                                ? 'bg-gray-900 text-white border-gray-900'
                                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                        }`}
                    >
                        Hide Completed
                    </button>
                </div>
            </div>

            {/* ── KPI Cards ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
                <KpiCard
                    label="To Do"
                    icon={<Circle size={14} />}
                    count={kpiCounts.todo}
                    isActive={activeKpi === 'todo'}
                    onClick={() => handleKpiClick('todo')}
                    activeClassName="border-gray-900 bg-gray-900 text-white shadow-sm"
                    defaultClassName="border-gray-200 bg-white hover:border-gray-300"
                />
                <KpiCard
                    label="In Progress"
                    icon={<Clock3 size={14} />}
                    count={kpiCounts.inProgress}
                    isActive={activeKpi === 'inprogress'}
                    onClick={() => handleKpiClick('inprogress')}
                    activeClassName="border-blue-500 bg-blue-50 text-blue-700 shadow-sm"
                    defaultClassName="border-gray-200 bg-white hover:border-gray-300"
                />
                <KpiCard
                    label="Completed"
                    icon={<CheckCircle2 size={14} />}
                    count={kpiCounts.completed}
                    isActive={activeKpi === 'completed'}
                    onClick={() => handleKpiClick('completed')}
                    activeClassName="border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm"
                    defaultClassName="border-gray-200 bg-white hover:border-gray-300"
                />
                <KpiCard
                    label="Overdue"
                    icon={<AlertTriangle size={14} />}
                    count={kpiCounts.overdue}
                    isActive={activeKpi === 'overdue'}
                    onClick={() => handleKpiClick('overdue')}
                    activeClassName="border-red-500 bg-red-50 text-red-700 shadow-sm"
                    defaultClassName="border-red-200 bg-red-50/70 text-red-700 hover:border-red-300"
                />
            </div>

            {/* ── Focus Today ── */}
            <FocusTodaySection tasks={focusTodayTasks} onOpenTask={handleOpenTask} />

            {/* ── Task Sections ── */}
            {tasks.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center text-gray-600 font-medium">
                    There are no tasks assigned to you.
                </div>
            ) : visibleTasks.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center text-gray-500">
                    No tasks match your current filters.
                </div>
            ) : (
                <div className="space-y-4">
                    {SECTIONS.filter(
                        (sec) => !hideCompleted || sec.key !== 'completed' || activeKpi === 'completed'
                    ).map((sec) => {
                        const items = groupedSections[sec.key];
                        const isOpen = sectionOpen[sec.key];
                        return (
                            <section
                                key={sec.key}
                                id={`tasks-section-${sec.key}`}
                                className="rounded-2xl border border-gray-200 bg-white"
                            >
                                <button
                                    type="button"
                                    onClick={() => toggleSection(sec.key)}
                                    className="w-full flex items-center justify-between px-4 py-3 border-b border-gray-100"
                                >
                                    <div className="flex items-center gap-2">
                                        {isOpen
                                            ? <ChevronDown size={15} className="text-gray-400" />
                                            : <ChevronRight size={15} className="text-gray-400" />}
                                        <h3 className={`text-sm font-semibold ${sec.tone}`}>
                                            {sec.label} ({items.length})
                                        </h3>
                                    </div>
                                </button>

                                {isOpen && (
                                    <div className="p-3 grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-3">
                                        {items.length === 0 ? (
                                            <div className="col-span-full px-3 py-5 text-sm text-gray-400">
                                                {sec.empty}
                                            </div>
                                        ) : (
                                            items.map((task) => (
                                                <MyTaskCard
                                                    key={task._id}
                                                    task={task}
                                                    userInfo={userInfo}
                                                    onOpen={handleOpenTask}
                                                />
                                            ))
                                        )}
                                    </div>
                                )}
                            </section>
                        );
                    })}
                </div>
            )}

            {/* ── Detail Modal ── */}
            <TaskDetailModal
                isOpen={!!selectedTask}
                onClose={handleCloseTask}
                card={selectedTask}
                projectMembers={selectedProjectMembers}
                onUpdate={fetchTasks}
            />
        </div>
    );
};

export default MyTasks;
