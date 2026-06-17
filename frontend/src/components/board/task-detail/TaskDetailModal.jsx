import { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { Trash2, X } from 'lucide-react';
import useWorkspaceStore from '../../../store/useWorkspaceStore';
import useAuthStore from '../../../store/useAuthStore';
import { emitProjectDataChanged } from '../../../utils/projectEvents';
import {
    PRIORITY_STYLES,
    normalizeDateInput,
    extractUserId,
} from './taskDetailUtils';
import TaskDescriptionSection from './TaskDescriptionSection';
import TaskSubtaskSection from './TaskSubtaskSection';
import TaskCommentSection from './TaskCommentSection';
import TaskSidebar from './TaskSidebar';
import ConfirmModal from '../../modals/ConfirmModal';
import AiSubtaskGeneratorModal from '../../ai/AiSubtaskGeneratorModal';

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
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [showAiBreakdown, setShowAiBreakdown] = useState(false);
    const [deleting, setDeleting] = useState(false);
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
    const [mentionOpen, setMentionOpen] = useState(false);
    const [mentionQuery, setMentionQuery] = useState('');
    const [mentionIndex, setMentionIndex] = useState(0);
    const commentTextareaRef = useRef(null);

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
    const filteredMentionMembers = useMemo(() => {
        if (!mentionOpen) return [];
        const query = mentionQuery.toLowerCase();
        return normalizedProjectMembers.filter((member) =>
            member.fullname.toLowerCase().includes(query)
        );
    }, [mentionOpen, mentionQuery, normalizedProjectMembers]);

    const completedSubtasks = subtasks.filter((s) => !!s?.done).length;
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

    const handleDeleteSubtask = async (subtaskId) => {
        if (!canEditTask) return;
        try {
            await axios.delete(`/api/board/cards/${cardId}/subtasks/${subtaskId}`);
            setSubtasks((prev) => prev.filter((item) => String(item._id) !== String(subtaskId)));
            syncTaskChanged('task-detail-subtask-delete');
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Failed to delete subtask');
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
        setDeleting(true);
        try {
            await axios.delete(`/api/board/cards/${cardId}`);
            toast.success('Task deleted');
            syncTaskChanged('task-detail-delete');
            setDeleteConfirmOpen(false);
            onClose();
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Failed to delete task');
        } finally {
            setDeleting(false);
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

    const handleCommentChange = (event) => {
        const value = event.target.value;
        setCommentDraft(value);

        const textarea = event.target;
        const cursorPos = textarea.selectionStart;
        const textBeforeCursor = value.slice(0, cursorPos);

        const mentionMatch = textBeforeCursor.match(/(?:^|\s)@(\w*)$/);
        if (mentionMatch) {
            setMentionOpen(true);
            setMentionQuery(mentionMatch[1]);
            setMentionIndex(0);
        } else {
            setMentionOpen(false);
            setMentionQuery('');
        }
    };

    const insertMention = (member) => {
        const textarea = commentTextareaRef.current;
        if (!textarea) return;

        const cursorPos = textarea.selectionStart;
        const textBeforeCursor = commentDraft.slice(0, cursorPos);
        const textAfterCursor = commentDraft.slice(cursorPos);

        const mentionMatch = textBeforeCursor.match(/(?:^|\s)@(\w*)$/);
        if (!mentionMatch) return;

        const matchStart = textBeforeCursor.lastIndexOf('@' + mentionMatch[1]);
        const before = commentDraft.slice(0, matchStart);
        const mentionText = `@${member.fullname} `;
        const newValue = before + mentionText + textAfterCursor;

        setCommentDraft(newValue);
        setMentionOpen(false);
        setMentionQuery('');

        setTimeout(() => {
            textarea.focus();
            const newPos = before.length + mentionText.length;
            textarea.setSelectionRange(newPos, newPos);
        }, 0);
    };

    const handleCommentKeyDown = (event) => {
        if (mentionOpen && filteredMentionMembers.length > 0) {
            if (event.key === 'ArrowDown') {
                event.preventDefault();
                setMentionIndex((prev) => (prev + 1) % filteredMentionMembers.length);
                return;
            }
            if (event.key === 'ArrowUp') {
                event.preventDefault();
                setMentionIndex((prev) => (prev - 1 + filteredMentionMembers.length) % filteredMentionMembers.length);
                return;
            }
            if (event.key === 'Enter' || event.key === 'Tab') {
                event.preventDefault();
                insertMention(filteredMentionMembers[mentionIndex]);
                return;
            }
            if (event.key === 'Escape') {
                event.preventDefault();
                setMentionOpen(false);
                return;
            }
        }
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            handleSendComment();
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/55 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-[84vw] max-w-[920px] h-[72vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col">
                {/* Header */}
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
                                onClick={() => setDeleteConfirmOpen(true)}
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

                {/* Body */}
                <div className="flex-1 min-h-0 flex">
                    {/* Left Panel */}
                    <div className="w-[65%] min-w-0 border-r border-gray-100 p-5 overflow-y-auto space-y-5">
                        <TaskDescriptionSection
                            description={description}
                            canEditTask={canEditTask}
                            descriptionEditOpen={descriptionEditOpen}
                            setDescriptionEditOpen={setDescriptionEditOpen}
                            setDescription={setDescription}
                            onSave={handleSaveDescription}
                            isSaving={isSavingDescription}
                            originalDescription={card.description || ''}
                        />

                        <TaskSubtaskSection
                            subtasks={subtasks}
                            canEditTask={canEditTask}
                            newSubtask={newSubtask}
                            setNewSubtask={setNewSubtask}
                            onAdd={handleAddSubtask}
                            onToggle={handleToggleSubtask}
                            onDelete={handleDeleteSubtask}
                            submitting={subtaskSubmitting}
                            completedCount={completedSubtasks}
                            onBreakDown={() => setShowAiBreakdown(true)}
                        />

                        <TaskCommentSection
                            sortedComments={sortedComments}
                            canAddComment={canAddComment}
                            isAdminOrOwner={isAdminOrOwner}
                            userInfo={userInfo}
                            commentDraft={commentDraft}
                            onCommentChange={handleCommentChange}
                            onCommentKeyDown={handleCommentKeyDown}
                            onSendComment={handleSendComment}
                            onDeleteComment={handleDeleteComment}
                            commentSubmitting={commentSubmitting}
                            commentTextareaRef={commentTextareaRef}
                            mentionOpen={mentionOpen}
                            filteredMentionMembers={filteredMentionMembers}
                            mentionIndex={mentionIndex}
                            onInsertMention={insertMention}
                        />
                    </div>

                    {/* Right Sidebar */}
                    <TaskSidebar
                        activity={activity}
                        assignees={assignees}
                        normalizedProjectMembers={normalizedProjectMembers}
                        selectedAssigneeNames={selectedAssigneeNames}
                        assigneeOpen={assigneeOpen}
                        setAssigneeOpen={setAssigneeOpen}
                        canManageAssignees={canManageAssignees}
                        onAssigneeToggle={handleAssigneeToggle}
                        attachments={attachments}
                        canAttach={canAttach}
                        uploading={uploading}
                        onFileUpload={handleFileUpload}
                        dueDate={dueDate}
                        canEditTask={canEditTask}
                        onDueDateChange={handleDueDateChange}
                        isOverdue={isOverdue}
                    />
                </div>
            </div>

            <ConfirmModal
                isOpen={deleteConfirmOpen}
                title="Delete Task"
                message={`Are you sure you want to permanently delete "${taskTitle}"? This action cannot be undone.`}
                confirmText="Delete"
                cancelText="Cancel"
                variant="danger"
                loading={deleting}
                onConfirm={handleDeleteTask}
                onClose={() => setDeleteConfirmOpen(false)}
            />

            <AiSubtaskGeneratorModal
                isOpen={showAiBreakdown}
                onClose={() => setShowAiBreakdown(false)}
                cardId={cardId}
                taskTitle={taskTitle}
                taskDescription={description}
                onCreated={async () => {
                    try {
                        const boardRes = await axios.get(`/api/board/${cardProjectId}`);
                        const cards = boardRes.data.cards || [];
                        const updatedCard = cards.find((c) => String(c._id) === String(cardId));
                        if (updatedCard) {
                            hydrateFromCard(updatedCard);
                        }
                        syncTaskChanged('ai-subtask-breakdown');
                    } catch (e) {
                        syncTaskChanged('ai-subtask-breakdown');
                    }
                }}
            />
        </div>
    );
};

export default TaskDetailModal;
