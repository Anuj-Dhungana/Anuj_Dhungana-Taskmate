import { AlertTriangle, CalendarDays, ChevronRight, MessageSquare, Paperclip } from 'lucide-react';
import {
    PRIORITY_STYLES,
    STATUS_STYLES,
    getDueMeta,
    getListTitle,
    getSubtaskStats,
    getTaskStatus,
    getUrgency,
    initialsFromName,
    toPriority,
} from '../../utils/taskHelpers';

/**
 * MyTaskCard — a single task card rendered inside a section bucket.
 *
 * Props:
 *   task     {Task}
 *   userInfo {User}
 *   onOpen   {(task: Task) => void}
 */
const MyTaskCard = ({ task, userInfo, onOpen }) => {
    const now = new Date();
    const urgency = getUrgency(task, now);
    const dueMeta = getDueMeta(task, now);
    const status = getTaskStatus(task);
    const statusLabel = getListTitle(task) || 'To Do';
    const priority = toPriority(task.priority);
    const { done, total } = getSubtaskStats(task);
    const subtaskProgress = total > 0 ? Math.round((done / total) * 100) : 0;
    const attachmentCount = task?.attachments?.length || 0;
    const commentCount = task?.comments?.length || 0;
    const isOverdue = urgency === 'overdue';

    const rowAssignee =
        (task?.assignees || []).find(
            (a) => String(a?._id || a) === String(userInfo?._id || '')
        ) || task?.assignees?.[0];
    const rowAssigneeName = rowAssignee?.fullname || userInfo?.fullname || 'You';
    const rowAssigneeAvatar = rowAssignee?.avatar || userInfo?.avatar || '';

    return (
        <div
            role="button"
            tabIndex={0}
            onClick={() => onOpen(task)}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onOpen(task);
                }
            }}
            className="bg-white p-4 rounded-xl border border-gray-200 touch-none transition-all group cursor-pointer hover:border-gray-300 hover:shadow-md"
        >
            {/* Priority + Status + Overdue badge */}
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${PRIORITY_STYLES[priority]}`}>
                        {priority}
                    </span>
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${STATUS_STYLES[status]}`}>
                        {statusLabel}
                    </span>
                </div>
                {isOverdue && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                        <AlertTriangle size={10} />
                        Overdue
                    </span>
                )}
            </div>

            {/* Title */}
            <h4 className="text-sm font-semibold text-gray-800 leading-snug">{task.title}</h4>

            {/* Description */}
            {task.description && (
                <p className="text-xs text-gray-400 mt-1 line-clamp-1">{task.description}</p>
            )}

            {/* Project name */}
            <div className="text-xs text-gray-500 mt-1.5">{task?.projectId?.name || 'Project'}</div>

            {/* Subtask progress bar */}
            {total > 0 && (
                <div className="mt-3">
                    <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[11px] font-medium text-indigo-600">Subtasks</span>
                        <span className="text-[11px] font-semibold text-gray-600">{done}/{total}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-gray-200 overflow-hidden">
                        <div className="h-full bg-violet-500 transition-all" style={{ width: `${subtaskProgress}%` }} />
                    </div>
                </div>
            )}

            {/* Footer: due date / attachments / comments / assignee */}
            <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-gray-100">
                <div className="flex items-center gap-3 text-gray-400">
                    {task?.dueDate && (
                        <span className={`flex items-center gap-1 text-[11px] ${dueMeta.tone}`}>
                            {isOverdue ? <AlertTriangle size={12} /> : <CalendarDays size={12} />}
                            {dueMeta.text}
                        </span>
                    )}
                    {attachmentCount > 0 && (
                        <span className="flex items-center gap-1 text-[11px]">
                            <Paperclip size={12} />
                            {attachmentCount}
                        </span>
                    )}
                    {commentCount > 0 && (
                        <span className="flex items-center gap-1 text-[11px]">
                            <MessageSquare size={12} />
                            {commentCount}
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    {rowAssigneeAvatar ? (
                        <img
                            src={rowAssigneeAvatar}
                            alt={rowAssigneeName}
                            className="w-6 h-6 rounded-full object-cover border border-gray-200"
                            title={rowAssigneeName}
                        />
                    ) : (
                        <div
                            className="w-6 h-6 rounded-full bg-gray-200 text-[10px] font-semibold text-gray-700 flex items-center justify-center border border-gray-200"
                            title={rowAssigneeName}
                        >
                            {initialsFromName(rowAssigneeName)}
                        </div>
                    )}
                    <ChevronRight size={16} className="text-gray-400" />
                </div>
            </div>
        </div>
    );
};

export default MyTaskCard;
