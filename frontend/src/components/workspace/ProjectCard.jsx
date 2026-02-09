import { CalendarIcon, MoreVertical, AlertTriangle } from 'lucide-react';
import { formatDueDate, getPriorityUi } from '../../utils/projectHelpers';

const clampTwoLines = {
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
};

const ProjectCard = ({
    project,
    showMenu,
    isMenuOpen,
    onProjectClick,
    onMenuToggle,
    onEdit,
    onDelete,
    onSettings,
}) => {
    const moreMembers = Math.max(0, (project.resolvedMembers || []).length - 3);

    return (
        <button
            onClick={() => onProjectClick(project._id)}
            className="group relative overflow-hidden text-left rounded-xl border border-gray-200 bg-white p-4 pt-5 hover:shadow-lg hover:border-gray-300 transition"
        >
            <div
                className="absolute left-0 top-0 h-1 w-full"
                style={{ backgroundColor: project.accentColor }}
            />

            <div className="flex items-start justify-between gap-2 mb-2">
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                        <h3 className="text-base font-semibold text-gray-900 truncate">{project.name}</h3>
                        {project.label && (
                            <span 
                                className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium whitespace-nowrap border"
                                style={{
                                    backgroundColor: project.accentColor ? `${project.accentColor}15` : 'rgb(243, 244, 246)',
                                    color: project.accentColor || 'rgb(75, 85, 99)',
                                    borderColor: project.accentColor ? `${project.accentColor}30` : 'rgb(229, 231, 235)'
                                }}
                            >
                                {project.label}
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    {project.behindSchedule && (
                        <div 
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-red-500 hover:bg-red-50 transition"
                            title="Behind schedule: overdue end date or incomplete tasks past deadline"
                        >
                            <AlertTriangle size={16} />
                        </div>
                    )}
                    
                    {showMenu && (
                        <div className="relative">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onMenuToggle(project._id);
                                }}
                                className="w-8 h-8 rounded-lg border border-transparent text-gray-400 hover:text-gray-600 hover:border-gray-200 hover:bg-gray-50 flex items-center justify-center"
                            >
                                <MoreVertical size={16} />
                            </button>

                            {isMenuOpen && (
                                <div className="absolute right-0 mt-1 w-36 rounded-lg border border-gray-200 bg-white shadow-lg z-20 overflow-hidden">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onEdit(project._id);
                                        }}
                                        className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-gray-50"
                                        title="Edit project settings"
                                    >
                                        Edit Project
                                    </button>

                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onDelete(project);
                                        }}
                                        className="w-full text-left px-3 py-2 text-xs text-red-600 hover:bg-red-50"
                                    >
                                        Delete
                                    </button>

                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onSettings(project);
                                        }}
                                        className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-gray-50"
                                    >
                                        Settings
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-2 mb-2">
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${project.statusUi.badge}`}>
                    {project.statusUi.label}
                </span>
                <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${getPriorityUi(project.priority)}`}>
                    {project.priority}
                </span>
            </div>

            <p className="text-sm text-gray-600 mb-3 min-h-10" style={clampTwoLines}>
                {project.description || 'No description provided.'}
            </p>

            <div className="mb-3">
                <div className="flex items-center justify-between text-[11px] text-gray-500 mb-1">
                    <span>Progress</span>
                    <span className="text-gray-800 font-semibold">{project.progress}%</span>
                </div>
                <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                    <div
                        className="h-full"
                        style={{
                            width: `${project.progress}%`,
                            backgroundColor: project.accentColor,
                        }}
                    />
                </div>
                <p className="text-[11px] text-gray-500 mt-1">
                    {project.tasksDone} / {project.tasksTotal} tasks completed
                </p>
            </div>

            <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-2">
                <div className="text-[11px] text-gray-500 inline-flex items-center gap-1">
                    <CalendarIcon size={12} />
                    <span>{formatDueDate(project.dueDate)}</span>
                </div>

                <div className="flex items-center -space-x-1">
                    {(project.resolvedMembers || []).slice(0, 3).map((member) => (
                        <div
                            key={member._id}
                            className="w-6 h-6 rounded-full border border-white bg-indigo-100 text-indigo-700 text-[10px] font-semibold flex items-center justify-center overflow-hidden"
                            title={member.fullname}
                        >
                            {member.avatar ? (
                                <img src={member.avatar} alt={member.fullname} className="w-full h-full object-cover" />
                            ) : (
                                member.fullname
                                    ?.split(' ')
                                    .map((p) => p[0])
                                    .join('')
                                    .substring(0, 2)
                                    .toUpperCase()
                            )}
                        </div>
                    ))}

                    {moreMembers > 0 && (
                        <div
                            className="w-6 h-6 rounded-full border border-white bg-gray-200 text-gray-600 text-[10px] font-semibold flex items-center justify-center"
                            title={`${moreMembers} more members`}
                        >
                            +{moreMembers}
                        </div>
                    )}
                </div>
            </div>
        </button>
    );
};

export default ProjectCard;
