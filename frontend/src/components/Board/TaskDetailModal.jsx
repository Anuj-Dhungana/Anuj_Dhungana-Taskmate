import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import {
    Calendar as CalendarIcon,
    CheckSquare,
    ChevronDown,
    Clock3,
    MessageSquare,
    Paperclip,
    Plus,
    Send,
    Trash2,
    X,
} from 'lucide-react';
import useWorkspaceStore from '../../store/useWorkspaceStore';
import useAuthStore from '../../store/useAuthStore';
import { emitProjectDataChanged } from '../../utils/projectEvents';

const PRIORITY_STYLES = {
    High: 'bg-red-100 text-red-700 border border-red-200',
    Medium: 'bg-amber-100 text-amber-700 border border-amber-200',
    Low: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
};

const escapeHtml = (value = '') =>
    String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

const renderMarkdownLite = (value = '') => {
    const escaped = escapeHtml(value);
    const withBold = escaped.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    const withLinks = withBold.replace(
        /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
        '<a href="$2" target="_blank" rel="noreferrer" class="text-blue-600 underline">$1</a>'
    );
    return withLinks.replace(/\n/g, '<br/>');
};

const renderCommentLite = (value = '') => {
    const escaped = escapeHtml(value);
    const withMentions = escaped.replace(
        /@([A-Za-z0-9_.-]+(?:\s+[A-Za-z0-9_.-]+)?)/g,
        '<span class="inline-block px-1.5 py-0.5 rounded-md bg-blue-100 text-blue-700 font-medium">@$1</span>'
    );
    const withBold = withMentions.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    const withLinks = withBold.replace(
        /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
        '<a href="$2" target="_blank" rel="noreferrer" class="text-blue-600 underline">$1</a>'
    );
    return withLinks.replace(/\n/g, '<br/>');
};

const normalizeDateInput = (value) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toISOString().split('T')[0];
};

const formatRelativeTime = (value) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    const diffMs = Date.now() - date.getTime();
    const seconds = Math.floor(diffMs / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
};

const initialsFromName = (name = '') =>
    String(name)
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0])
        .join('')
        .toUpperCase() || 'U';

const isImageUrl = (url = '') => /\.(png|jpe?g|gif|webp|svg)(\?.*)?$/i.test(url);
const extractUserId = (member) =>
    String(member?.user?._id || member?.user || member?._id || '');
const toCommentAuthor = (comment) => comment?.author || {};

const TaskDetailModal = ({ isOpen, onClose, card, projectMembers = [], onUpdate }) => {
    const { selectedWorkspace } = useWorkspaceStore();
    const { userInfo } = useAuthStore();

    const [isSavingTitle, setIsSavingTitle] = useState(false);
    const [isSavingDescription, setIsSavingDescription] = useState(false);
    const [descriptionEditOpen, setDescriptionEditOpen] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [commentSubmitting, setCommentSubmitting] = useState(false);
    const [subtaskSubmitting, setSubtaskSubmitting] = useState(false);
    const [savingTask, setSavingTask] = useState(false);
    const [assigneeOpen, setAssigneeOpen] = useState(false);
    const [taskTitle, setTaskTitle] = useState('');
    const [savedTitle, setSavedTitle] = useState('');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState('Medium');
    const [dueDate, setDueDate] = useState('');
    const [assignees, setAssignees] = useState([]);
    const [attachments, setAttachments] = useState([]);
    const [subtasks, setSubtasks] = useState([]);
    const [comments, setComments] = useState([]);
    const [activity, setActivity] = useState([]);
    const [newSubtask, setNewSubtask] = useState('');
    const [commentDraft, setCommentDraft] = useState('');

    const workspaceMembers = selectedWorkspace?.workspace?.members || [];
    const normalizedProjectMembers = useMemo(() => {
        const byId = new Map();
        projectMembers.forEach((member) => {
            const user = member?.user || member;
            const id = extractUserId(user);
            if (!id || byId.has(id)) return;
            byId.set(id, {
                _id: id,
                fullname: user?.fullname || 'Unknown user',
                avatar: user?.avatar || '',
            });
        });
        return Array.from(byId.values());
    }, [projectMembers]);

    const cardId = card?._id;
    const cardProjectId = card?.projectId?._id || card?.projectId;
    const myRole = workspaceMembers.find((m) => extractUserId(m) === String(userInfo?._id || ''))?.role;
    const isAdminOrOwner = myRole === 'owner' || myRole === 'admin';
    const isAssigned = assignees.some((id) => String(id) === String(userInfo?._id || ''));
    const isWorkspaceMember = workspaceMembers.some((m) => extractUserId(m) === String(userInfo?._id || ''));
    const canEditTask = isAdminOrOwner || isAssigned;
    const canManageAssignees = isAdminOrOwner;
    const canAddComment = isWorkspaceMember;
    const canDeleteTask = isAdminOrOwner;
    const canAttach = canEditTask;
    const sortedComments = useMemo(
        () =>
            [...comments].sort(
                (a, b) => new Date(a?.createdAt || 0).getTime() - new Date(b?.createdAt || 0).getTime()
            ),
        [comments]
    );
    const selectedAssigneeNames = useMemo(() => {
        if (!assignees.length) return '';
        return normalizedProjectMembers
            .filter((member) => assignees.includes(member._id))
            .map((member) => member.fullname)
            .join(', ');
    }, [assignees, normalizedProjectMembers]);
    const completedSubtasks = subtasks.filter((s) => !!s?.done).length;
    const subtaskProgress = subtasks.length ? Math.round((completedSubtasks / subtasks.length) * 100) : 0;
    const isOverdue = dueDate && new Date(dueDate) < new Date() && !Number.isNaN(new Date(dueDate).getTime());

    const hydrateFromCard = (nextCard) => {
        if (!nextCard) return;
        setTaskTitle(nextCard.title || '');
        setSavedTitle(nextCard.title || '');
        setDescription(nextCard.description || '');
        setPriority(nextCard.priority || 'Medium');
        setDueDate(normalizeDateInput(nextCard.dueDate));
        setAssignees((nextCard.assignees || []).map((a) => extractUserId(a)).filter(Boolean));
        setAttachments(nextCard.attachments || []);
        setSubtasks(nextCard.subtasks || []);
        setComments(nextCard.comments || []);
        setActivity(nextCard.activity || []);
    };

    useEffect(() => {
        if (!isOpen || !card) return;
        hydrateFromCard(card);
        setDescriptionEditOpen(false);
        setAssigneeOpen(false);
    }, [isOpen, card]);

    if (!isOpen || !card) return null;

    const syncTaskChanged = (source) => {
        emitProjectDataChanged({
            projectId: cardProjectId,
            source,
        });
        onUpdate?.();
    };

    const updateTask = async (payload, source = 'task-detail-update') => {
        const res = await axios.put(`/api/board/cards/${cardId}`, payload);
        hydrateFromCard(res.data);
        syncTaskChanged(source);
        return res.data;
    };

    const handlePriorityChange = async (nextPriority) => {
        if (!canEditTask) return;
        setPriority(nextPriority);
        try {
            await updateTask({ priority: nextPriority }, 'task-detail-priority');
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Failed to update priority');
        }
    };

    const handleTitleBlur = async () => {
        if (!canEditTask) return;
        const nextTitle = taskTitle.trim();
        if (!nextTitle) {
            setTaskTitle(savedTitle);
            return;
        }
        if (nextTitle === savedTitle.trim()) {
            setTaskTitle(savedTitle);
            return;
        }
        setIsSavingTitle(true);
        try {
            await updateTask({ title: nextTitle }, 'task-detail-title');
            setSavedTitle(nextTitle);
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Failed to update title');
            setTaskTitle(savedTitle);
        } finally {
            setIsSavingTitle(false);
        }
    };

    const handleSaveDescription = async () => {
        if (!canEditTask) return;
        setIsSavingDescription(true);
        try {
            await updateTask({ description }, 'task-detail-description');
            setDescriptionEditOpen(false);
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Failed to update description');
        } finally {
            setIsSavingDescription(false);
        }
    };

    const handleDueDateChange = async (nextDate) => {
        if (!canEditTask) return;
        setDueDate(nextDate);
        try {
            await updateTask({ dueDate: nextDate || undefined }, 'task-detail-due-date');
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Failed to update due date');
        }
    };

    const handleAssigneeToggle = async (userId) => {
        if (!canManageAssignees) return;
        const nextAssignees = assignees.includes(userId)
            ? assignees.filter((id) => id !== userId)
            : [...assignees, userId];
        setAssignees(nextAssignees);
        try {
            await updateTask({ assignees: nextAssignees }, 'task-detail-assignees');
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Failed to update assignees');
        }
    };

    const handleFileUpload = async (event) => {
        if (!canAttach) return;
        const file = event.target.files?.[0];
        if (!file) return;
        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            const res = await axios.put(`/api/board/cards/${cardId}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            hydrateFromCard(res.data);
            syncTaskChanged('task-detail-upload');
            toast.success('Attachment added');
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Upload failed');
        } finally {
            setUploading(false);
            event.target.value = '';
        }
    };

    const handleAddSubtask = async () => {
        if (!canEditTask) return;
        const text = newSubtask.trim();
        if (!text) return;
        setSubtaskSubmitting(true);
        try {
            const res = await axios.post(`/api/board/cards/${cardId}/subtasks`, { text });
            setSubtasks((prev) => [...prev, res.data.subtask]);
            setNewSubtask('');
            syncTaskChanged('task-detail-subtask-add');
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Failed to add subtask');
        } finally {
            setSubtaskSubmitting(false);
        }
    };

    const handleToggleSubtask = async (subtaskId, done) => {
        if (!canEditTask) return;
        setSubtasks((prev) =>
            prev.map((item) => (String(item._id) === String(subtaskId) ? { ...item, done } : item))
        );
        try {
            await axios.put(`/api/board/cards/${cardId}/subtasks/${subtaskId}`, { done });
            syncTaskChanged('task-detail-subtask-toggle');
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Failed to update subtask');
        }
    };

    const handleSendComment = async () => {
        if (!canAddComment) return;
        const content = commentDraft.trim();
        if (!content) return;
        setCommentSubmitting(true);
        try {
            const res = await axios.post(`/api/board/cards/${cardId}/comments`, { content });
            setComments((prev) => [...prev, res.data.comment]);
            setCommentDraft('');
            syncTaskChanged('task-detail-comment-add');
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Failed to add comment');
        } finally {
            setCommentSubmitting(false);
        }
    };

    const handleDeleteComment = async (commentId) => {
        try {
            await axios.delete(`/api/board/cards/${cardId}/comments/${commentId}`);
            setComments((prev) => prev.filter((item) => String(item._id) !== String(commentId)));
            syncTaskChanged('task-detail-comment-delete');
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Failed to delete comment');
        }
    };

    const handleDeleteTask = async () => {
        if (!canDeleteTask) return;
        const confirmed = window.confirm('Delete this task permanently?');
        if (!confirmed) return;
        try {
            await axios.delete(`/api/board/cards/${cardId}`);
            toast.success('Task deleted');
            syncTaskChanged('task-detail-delete');
            onClose();
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Failed to delete task');
        }
    };

    const handleSaveTask = async () => {
        if (!canEditTask) return;
        const nextTitle = taskTitle.trim();
        if (!nextTitle) {
            toast.error('Title is required');
            return;
        }
        setSavingTask(true);
        try {
            const payload = {
                title: nextTitle,
                description,
                priority,
                dueDate: dueDate || undefined,
            };
            if (canManageAssignees) {
                payload.assignees = assignees;
            }
            await updateTask(payload, 'task-detail-save-button');
            setSavedTitle(nextTitle);
            setDescriptionEditOpen(false);
            toast.success('Task saved');
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Failed to save task');
        } finally {
            setSavingTask(false);
        }
    };

    const handleCommentKeyDown = (event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            handleSendComment();
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/55 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-[84vw] max-w-[920px] h-[72vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col">
                <div className="sticky top-0 z-20 border-b border-gray-100 bg-white/95 backdrop-blur px-5 py-4 flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1 flex items-start gap-3">
                        <div className="shrink-0">
                            {canEditTask ? (
                                <select
                                    value={priority}
                                    onChange={(event) => handlePriorityChange(event.target.value)}
                                    className={`text-xs font-semibold px-2.5 py-1.5 rounded-full outline-none ${PRIORITY_STYLES[priority] || PRIORITY_STYLES.Medium}`}
                                >
                                    {['High', 'Medium', 'Low'].map((level) => (
                                        <option key={level} value={level}>
                                            {level}
                                        </option>
                                    ))}
                                </select>
                            ) : (
                                <span className={`text-xs font-semibold px-2.5 py-1.5 rounded-full ${PRIORITY_STYLES[priority] || PRIORITY_STYLES.Medium}`}>
                                    {priority}
                                </span>
                            )}
                        </div>
                        <div className="min-w-0 flex-1">
                            <input
                                value={taskTitle}
                                onChange={(event) => setTaskTitle(event.target.value)}
                                onBlur={handleTitleBlur}
                                readOnly={!canEditTask}
                                className={`w-full text-xl font-bold bg-transparent outline-none border-b ${
                                    canEditTask ? 'border-transparent focus:border-blue-400' : 'border-transparent'
                                } pb-1`}
                            />
                            <p className="text-[11px] text-gray-400 mt-1">{isSavingTitle ? 'Saving title...' : ''}</p>
                        </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-2">
                        {canEditTask && (
                            <button
                                onClick={handleSaveTask}
                                disabled={savingTask}
                                className="px-3 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-60"
                            >
                                {savingTask ? 'Saving...' : 'Save'}
                            </button>
                        )}
                        {canDeleteTask && (
                            <button
                                onClick={handleDeleteTask}
                                title="Delete task"
                                className="w-9 h-9 rounded-lg border border-red-200 text-red-500 hover:text-red-600 hover:bg-red-50 flex items-center justify-center"
                            >
                                <Trash2 size={17} />
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="w-9 h-9 rounded-lg border border-gray-200 text-gray-500 hover:text-gray-700 hover:bg-gray-50 flex items-center justify-center"
                        >
                            <X size={17} />
                        </button>
                    </div>
                </div>

                <div className="flex-1 min-h-0 flex">
                    <div className="w-[65%] min-w-0 border-r border-gray-100 p-5 overflow-y-auto space-y-5">
                        <section className="rounded-xl border border-gray-100 bg-white">
                            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                                <h3 className="text-sm font-semibold text-gray-800">Description</h3>
                                {canEditTask && !descriptionEditOpen && (
                                    <button
                                        onClick={() => setDescriptionEditOpen(true)}
                                        className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                                    >
                                        Edit
                                    </button>
                                )}
                            </div>
                            <div className="p-4">
                                {descriptionEditOpen ? (
                                    <div className="space-y-2">
                                        <textarea
                                            value={description}
                                            onChange={(event) => setDescription(event.target.value)}
                                            className="w-full h-28 p-3 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                            placeholder="Add a description..."
                                        />
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => {
                                                    setDescription(card.description || '');
                                                    setDescriptionEditOpen(false);
                                                }}
                                                className="px-3 py-1.5 text-xs border border-gray-200 rounded-md text-gray-600 hover:bg-gray-50"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={handleSaveDescription}
                                                disabled={isSavingDescription}
                                                className="px-3 py-1.5 text-xs rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
                                            >
                                                {isSavingDescription ? 'Saving...' : 'Save'}
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => canEditTask && setDescriptionEditOpen(true)}
                                        className={`w-full text-left text-sm ${
                                            description ? 'text-gray-700' : 'text-gray-400 italic'
                                        }`}
                                    >
                                        {description ? (
                                            <span dangerouslySetInnerHTML={{ __html: renderMarkdownLite(description) }} />
                                        ) : (
                                            'Add a description...'
                                        )}
                                    </button>
                                )}
                            </div>
                        </section>

                        <section className="rounded-xl border border-gray-100 bg-white">
                            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <CheckSquare size={16} className="text-gray-500" />
                                    <h3 className="text-sm font-semibold text-gray-800">Subtasks</h3>
                                    <span className="text-xs text-gray-500">
                                        {completedSubtasks}/{subtasks.length}
                                    </span>
                                </div>
                                <div className="text-xs text-gray-500">{subtaskProgress}%</div>
                            </div>
                            <div className="p-4 space-y-2">
                                {subtasks.map((subtask) => (
                                    <label
                                        key={subtask._id}
                                        className={`flex items-center gap-2 px-2 py-1.5 rounded-md ${
                                            canEditTask ? 'hover:bg-gray-50 cursor-pointer' : 'opacity-70'
                                        }`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={!!subtask.done}
                                            onChange={(event) => handleToggleSubtask(subtask._id, event.target.checked)}
                                            disabled={!canEditTask}
                                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        />
                                        <span
                                            className={`text-sm ${
                                                subtask.done ? 'text-gray-400 line-through' : 'text-gray-700'
                                            }`}
                                        >
                                            {subtask.text}
                                        </span>
                                    </label>
                                ))}
                                {subtasks.length === 0 && <p className="text-sm text-gray-400">No subtasks yet.</p>}
                                <div className="pt-2 flex items-center gap-2">
                                    <input
                                        value={newSubtask}
                                        onChange={(event) => setNewSubtask(event.target.value)}
                                        onKeyDown={(event) => {
                                            if (event.key === 'Enter') {
                                                event.preventDefault();
                                                handleAddSubtask();
                                            }
                                        }}
                                        disabled={!canEditTask}
                                        placeholder="Add subtask"
                                        className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-400"
                                    />
                                    <button
                                        onClick={handleAddSubtask}
                                        disabled={!canEditTask || subtaskSubmitting}
                                        className="inline-flex items-center gap-1 px-3 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
                                    >
                                        <Plus size={14} />
                                        Add
                                    </button>
                                </div>
                            </div>
                        </section>

                        <section className="rounded-xl border border-gray-100 bg-white overflow-hidden">
                            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <MessageSquare size={16} className="text-gray-500" />
                                    <h3 className="text-sm font-semibold text-gray-800">
                                        Comments ({sortedComments.length})
                                    </h3>
                                </div>
                            </div>
                            <div className="max-h-[360px] overflow-y-auto px-4 py-3 space-y-3">
                                {sortedComments.map((comment) => {
                                    const author = toCommentAuthor(comment);
                                    const authorName = author?.fullname || 'User';
                                    const authorId = String(author?._id || '');
                                    const canDelete =
                                        isAdminOrOwner || authorId === String(userInfo?._id || '');
                                    return (
                                        <div key={comment._id} className="rounded-lg bg-gray-50 px-3 py-2.5">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex items-start gap-2.5 min-w-0">
                                                    {author?.avatar ? (
                                                        <img
                                                            src={author.avatar}
                                                            alt={authorName}
                                                            className="w-6 h-6 rounded-full object-cover shrink-0 mt-0.5"
                                                        />
                                                    ) : (
                                                        <div className="w-6 h-6 rounded-full bg-blue-600 text-white text-[10px] font-semibold flex items-center justify-center shrink-0 mt-0.5">
                                                            {initialsFromName(authorName)}
                                                        </div>
                                                    )}
                                                    <div className="min-w-0">
                                                        <p className="text-xs font-semibold text-gray-900">{authorName}</p>
                                                        <div
                                                            className="mt-0.5 text-sm text-gray-700 leading-5 break-words"
                                                            dangerouslySetInnerHTML={{ __html: renderCommentLite(comment.content) }}
                                                        />
                                                    </div>
                                                </div>
                                                {canDelete && (
                                                    <button
                                                        onClick={() => handleDeleteComment(comment._id)}
                                                        title={`Delete comment • ${formatRelativeTime(comment.createdAt)}`}
                                                        className="text-[11px] text-red-500 hover:text-red-600 shrink-0"
                                                    >
                                                        Delete
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                                {sortedComments.length === 0 && (
                                    <p className="text-sm text-gray-400">No comments yet. Start the discussion.</p>
                                )}
                            </div>
                            <div className="border-t border-gray-100 p-3 bg-white sticky bottom-0">
                                <div className="flex items-end gap-2">
                                    <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-700 text-xs font-semibold flex items-center justify-center shrink-0">
                                        {initialsFromName(userInfo?.fullname || '')}
                                    </div>
                                    <textarea
                                        value={commentDraft}
                                        onChange={(event) => setCommentDraft(event.target.value)}
                                        onKeyDown={handleCommentKeyDown}
                                        placeholder="Write a comment..."
                                        rows={1}
                                        className="min-w-0 w-full max-w-[360px] px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                    />
                                    <button
                                        onClick={handleSendComment}
                                        disabled={!canAddComment || commentSubmitting || !commentDraft.trim()}
                                        className="h-9 px-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 inline-flex items-center gap-1"
                                    >
                                        <Send size={14} />
                                        Send
                                    </button>
                                </div>
                                <p className="text-[11px] text-gray-400 mt-1">
                                    Enter to send, Shift+Enter for new line.
                                </p>
                            </div>
                        </section>

                    </div>

                    <div className="w-[35%] min-w-[290px] p-5 overflow-y-auto bg-gray-50/60 space-y-4">
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
                                                        onChange={() => handleAssigneeToggle(member._id)}
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
                                    onChange={handleFileUpload}
                                    disabled={!canAttach || uploading}
                                />
                            </label>
                            {!canAttach && (
                                <p className="text-[11px] text-gray-400 mt-2">
                                    Only assignees or admins can add attachments.
                                </p>
                            )}
                        </section>

                        <section className="rounded-xl border border-gray-200 bg-white p-4">
                            <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Due Date</h4>
                            <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2">
                                <CalendarIcon size={15} className="text-gray-400" />
                                <input
                                    type="date"
                                    value={dueDate}
                                    onChange={(event) => handleDueDateChange(event.target.value)}
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
                </div>
            </div>
        </div>
    );
};

export default TaskDetailModal;
