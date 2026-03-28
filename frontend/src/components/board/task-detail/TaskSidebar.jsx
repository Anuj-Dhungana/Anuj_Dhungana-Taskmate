import {
    Calendar as CalendarIcon,
    ChevronDown,
    Clock3,
    Paperclip,
} from 'lucide-react';
import { formatRelativeTime, initialsFromName, isImageUrl } from './taskDetailUtils';

const TaskSidebar = ({
    activity,
    assignees,
    normalizedProjectMembers,
    selectedAssigneeNames,
    assigneeOpen,
    setAssigneeOpen,
    canManageAssignees,
    onAssigneeToggle,
    attachments,
    canAttach,
    uploading,
    onFileUpload,
    dueDate,
    canEditTask,
    onDueDateChange,
    isOverdue,
}) => {
    return (
        <div className="w-[35%] min-w-[290px] p-5 overflow-y-auto bg-gray-50/60 space-y-4">
            {/* Activity */}
            <section className="rounded-xl border border-gray-200 bg-white">
                <div className="px-4 py-3 border-b border-gray-100">
                    <span className="text-sm font-semibold text-gray-800">Activity</span>
                </div>
                <div className="px-4 py-3 space-y-2 max-h-52 overflow-y-auto">
                    {[...activity]
                        .sort(
                            (a, b) =>
                                new Date(b?.createdAt || 0).getTime() -
                                new Date(a?.createdAt || 0).getTime()
                        )
                        .map((item) => (
                            <div key={item._id || `${item.type}-${item.createdAt}`} className="text-sm text-gray-600">
                                {item.message}{' '}
                                <span className="text-xs text-gray-400">{formatRelativeTime(item.createdAt)}</span>
                            </div>
                        ))}
                    {activity.length === 0 && (
                        <p className="text-sm text-gray-400">No activity yet.</p>
                    )}
                </div>
            </section>

            {/* Assignees */}
            <section className="rounded-xl border border-gray-200 bg-white p-4">
                <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Assignee</h4>
                <div className="relative">
                    <button
                        type="button"
                        onClick={() => canManageAssignees && setAssigneeOpen((prev) => !prev)}
                        disabled={!canManageAssignees}
                        className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-sm border border-gray-200 rounded-lg ${
                            canManageAssignees
                                ? 'bg-white hover:bg-gray-50 text-gray-700'
                                : 'bg-gray-50 text-gray-500 cursor-not-allowed'
                        }`}
                    >
                        <span className="truncate text-left">
                            {selectedAssigneeNames || 'Unassigned'}
                        </span>
                        <ChevronDown size={14} className="text-gray-400 shrink-0" />
                    </button>

                    {assigneeOpen && canManageAssignees && (
                        <div className="absolute left-0 right-0 mt-2 max-h-52 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg z-20">
                            {normalizedProjectMembers.map((member) => {
                                const checked = assignees.includes(member._id);
                                return (
                                    <label
                                        key={member._id}
                                        className="flex items-center gap-2 p-2 hover:bg-gray-50 cursor-pointer"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={checked}
                                            onChange={() => onAssigneeToggle(member._id)}
                                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        />
                                        {member.avatar ? (
                                            <img
                                                src={member.avatar}
                                                alt={member.fullname}
                                                className="w-6 h-6 rounded-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-6 h-6 rounded-full bg-gray-200 text-gray-700 text-[10px] font-semibold flex items-center justify-center">
                                                {initialsFromName(member.fullname)}
                                            </div>
                                        )}
                                        <span className="text-sm text-gray-700 truncate">{member.fullname}</span>
                                    </label>
                                );
                            })}
                            {normalizedProjectMembers.length === 0 && (
                                <p className="text-sm text-gray-400 p-3">No project members available.</p>
                            )}
                        </div>
                    )}
                </div>
                {!canManageAssignees && (
                    <p className="text-[11px] text-gray-400 mt-2">Only admins can reassign tasks.</p>
                )}
            </section>

            {/* Attachments */}
            <section className="rounded-xl border border-gray-200 bg-white p-4">
                <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Attachments</h4>
                <div className="space-y-2 max-h-56 overflow-y-auto">
                    {attachments.map((url, index) => (
                        <a
                            key={`${url}-${index}`}
                            href={url}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-2 p-2 rounded-lg border border-gray-100 hover:border-blue-200 hover:bg-blue-50/40"
                        >
                            {isImageUrl(url) ? (
                                <img src={url} alt="attachment" className="w-10 h-10 rounded object-cover" />
                            ) : (
                                <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center">
                                    <Paperclip size={15} className="text-gray-500" />
                                </div>
                            )}
                            <span className="text-sm text-gray-700 truncate">Attachment {index + 1}</span>
                        </a>
                    ))}
                    {attachments.length === 0 && <p className="text-sm text-gray-400">No attachments yet.</p>}
                </div>
                <label
                    className={`mt-3 inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
                        canAttach
                            ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 cursor-pointer'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                >
                    <Paperclip size={14} />
                    {uploading ? 'Uploading...' : 'Add file'}
                    <input
                        type="file"
                        className="hidden"
                        onChange={onFileUpload}
                        disabled={!canAttach || uploading}
                    />
                </label>
                {!canAttach && (
                    <p className="text-[11px] text-gray-400 mt-2">
                        Only assignees or admins can add attachments.
                    </p>
                )}
            </section>

            {/* Due Date */}
            <section className="rounded-xl border border-gray-200 bg-white p-4">
                <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Due Date</h4>
                <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2">
                    <CalendarIcon size={15} className="text-gray-400" />
                    <input
                        type="date"
                        value={dueDate}
                        onChange={(event) => onDueDateChange(event.target.value)}
                        disabled={!canEditTask}
                        className="flex-1 bg-transparent outline-none text-sm disabled:text-gray-500"
                    />
                </div>
                {dueDate && (
                    <p className={`mt-2 text-xs ${isOverdue ? 'text-red-500 font-semibold' : 'text-gray-500'}`}>
                        <Clock3 size={12} className="inline mr-1" />
                        {isOverdue ? 'Overdue' : 'Due on schedule'}
                    </p>
                )}
            </section>
        </div>
    );
};

export default TaskSidebar;
