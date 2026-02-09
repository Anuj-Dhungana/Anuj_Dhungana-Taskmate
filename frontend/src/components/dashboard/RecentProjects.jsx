import { useNavigate } from 'react-router-dom';
import { ArrowRight, FolderKanban, AlertTriangle } from 'lucide-react';
import { getStatusColor, formatShortDate } from '../../utils/dashboardHelpers';

const RecentProjects = ({ projects, onCreateProject }) => {
    const navigate = useNavigate();

    if (projects.length === 0) {
        return (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                <h2 className="text-base font-bold text-gray-900 mb-4">Recent Projects</h2>
                <div className="text-center py-10">
                    <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center mx-auto mb-3">
                        <FolderKanban size={28} className="text-indigo-400" />
                    </div>
                    <p className="text-sm font-semibold text-gray-700">No projects yet</p>
                    <p className="text-xs text-gray-400 mt-1 mb-4">Create a project to get started</p>
                    <button
                        onClick={onCreateProject}
                        className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition"
                    >
                        Create Project
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-gray-900">Recent Projects</h2>
                <button
                    onClick={() => navigate('/projects')}
                    className="text-xs text-indigo-600 font-semibold flex items-center gap-1 hover:text-indigo-700"
                >
                    View all <ArrowRight size={14} />
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {projects.map((project) => (
                    <button
                        key={project._id}
                        onClick={() => navigate(`/projects/${project._id}`)}
                        className="p-4 rounded-xl border border-gray-100 hover:border-indigo-200 hover:shadow-sm transition-all text-left group"
                    >
                        <div className="flex items-start gap-3">
                            <div
                                className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-sm font-bold shrink-0"
                                style={{ backgroundColor: project.projectColor || '#6366F1' }}
                            >
                                {project.name?.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2 mb-1">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <p className="text-sm font-semibold text-gray-900 truncate">{project.name}</p>
                                        {project.label && (
                                            <span 
                                                className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-medium whitespace-nowrap border"
                                                style={{
                                                    backgroundColor: project.projectColor ? `${project.projectColor}15` : 'rgb(243, 244, 246)',
                                                    color: project.projectColor || 'rgb(75, 85, 99)',
                                                    borderColor: project.projectColor ? `${project.projectColor}30` : 'rgb(229, 231, 235)'
                                                }}
                                            >
                                                {project.label}
                                            </span>
                                        )}
                                    </div>
                                    {project.behindSchedule && (
                                        <div 
                                            className="flex items-center justify-center text-red-500"
                                            title="Behind schedule: overdue end date or incomplete tasks past deadline"
                                        >
                                            <AlertTriangle size={14} />
                                        </div>
                                    )}
                                </div>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getStatusColor(project.status)}`}>
                                        {project.status || 'Planning'}
                                    </span>
                                </div>

                                {/* Progress bar */}
                                <div className="mt-2">
                                    <div className="flex items-center justify-between text-[10px] text-gray-400 mb-1">
                                        <span>{project.progress.done}/{project.progress.total} tasks</span>
                                        <span>{project.progress.percent}%</span>
                                    </div>
                                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-indigo-500 rounded-full transition-all"
                                            style={{ width: `${project.progress.percent}%` }}
                                        />
                                    </div>
                                </div>

                                {project.dueDate && (
                                    <p className="text-[10px] text-gray-400 mt-1.5">
                                        Due: {formatShortDate(project.dueDate)}
                                    </p>
                                )}
                            </div>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default RecentProjects;
