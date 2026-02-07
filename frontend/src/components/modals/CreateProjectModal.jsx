import { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { X, ChevronDown, ChevronUp } from 'lucide-react';
import useAuthStore from '../../store/useAuthStore';
import ConfirmModal from './ConfirmModal';
import { emitProjectDataChanged } from '../../utils/projectEvents';

const STATUS_OPTIONS = [
    { label: 'Planning', value: 'Planning' },
    { label: 'Active', value: 'Active' },
    { label: 'On Hold', value: 'On Hold' },
    { label: 'Completed', value: 'Completed' },
];

const PRIORITY_OPTIONS = ['Low', 'Medium', 'High'];
const COLOR_OPTIONS = ['#6366F1', '#3B82F6', '#14B8A6', '#22C55E', '#F59E0B', '#EF4444'];

const CreateProjectModal = ({ isOpen, onClose, workspaceId, onCreated, members = [] }) => {
    const navigate = useNavigate();
    const { userInfo } = useAuthStore();

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [status, setStatus] = useState('Planning');
    const [priority, setPriority] = useState('Medium');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [selectedMembers, setSelectedMembers] = useState({});
    const [isMemberPickerOpen, setIsMemberPickerOpen] = useState(false);
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [projectColor, setProjectColor] = useState(COLOR_OPTIONS[0]);
    const [projectLabel, setProjectLabel] = useState('');
    const [calendarEnabled, setCalendarEnabled] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [attemptedSubmit, setAttemptedSubmit] = useState(false);
    const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

    const modalRef = useRef(null);
    const nameInputRef = useRef(null);

    const myRole = members.find((m) => m.user?._id === userInfo?._id)?.role;
    const isAdminOrOwner = myRole === 'owner' || myRole === 'admin';

    const dateError = useMemo(() => {
        if (!startDate || !endDate) return '';

        const start = new Date(startDate);
        const end = new Date(endDate);

        if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return '';
        if (end < start) return 'End Date must be on or after Start Date.';
        return '';
    }, [startDate, endDate]);

    const selectedList = useMemo(() => {
        return Object.entries(selectedMembers)
            .map(([userId, role]) => {
                const m = members.find((item) => item.user?._id === userId);
                return m
                    ? { userId, role, fullname: m.user.fullname }
                    : null;
            })
            .filter(Boolean);
    }, [selectedMembers, members]);

    const hasUnsavedChanges = useMemo(() => {
        const hasMemberChanges = Object.keys(selectedMembers).length > 0;
        return (
            name.trim() !== '' ||
            description.trim() !== '' ||
            status !== 'Planning' ||
            priority !== 'Medium' ||
            startDate !== '' ||
            endDate !== '' ||
            hasMemberChanges ||
            showAdvanced ||
            projectColor !== COLOR_OPTIONS[0] ||
            projectLabel.trim() !== '' ||
            calendarEnabled !== true
        );
    }, [
        name,
        description,
        status,
        priority,
        startDate,
        endDate,
        selectedMembers,
        showAdvanced,
        projectColor,
        projectLabel,
        calendarEnabled,
    ]);

    const canSubmit = name.trim().length > 0 && !dateError && !loading;

    const resetForm = useCallback(() => {
        setName('');
        setDescription('');
        setStatus('Planning');
        setPriority('Medium');
        setStartDate('');
        setEndDate('');
        setSelectedMembers({});
        setIsMemberPickerOpen(false);
        setShowAdvanced(false);
        setProjectColor(COLOR_OPTIONS[0]);
        setProjectLabel('');
        setCalendarEnabled(true);
        setLoading(false);
        setError('');
        setAttemptedSubmit(false);
    }, []);

    const requestClose = useCallback(() => {
        if (hasUnsavedChanges) {
            setShowDiscardConfirm(true);
            return;
        }
        setShowDiscardConfirm(false);
        resetForm();
        onClose?.();
    }, [hasUnsavedChanges, onClose, resetForm]);

    const confirmDiscardAndClose = () => {
        setShowDiscardConfirm(false);
        resetForm();
        onClose?.();
    };

    const toggleMember = (userId) => {
        if (!isAdminOrOwner) return;

        setSelectedMembers((prev) => {
            const next = { ...prev };
            if (next[userId]) {
                delete next[userId];
            } else {
                next[userId] = 'Contributor';
            }
            return next;
        });
    };

    const updateMemberRole = (userId, role) => {
        if (!isAdminOrOwner) return;
        setSelectedMembers((prev) => ({ ...prev, [userId]: role }));
    };

    const trapFocus = (event) => {
        if (event.key !== 'Tab' || !modalRef.current) return;

        const focusables = Array.from(
            modalRef.current.querySelectorAll(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            )
        ).filter((el) => !el.disabled);

        if (focusables.length === 0) return;

        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
            return;
        }

        if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
        }
    };

    useEffect(() => {
        if (!isOpen) return;

        const keyHandler = (event) => {
            if (event.key === 'Escape') {
                event.preventDefault();
                requestClose();
                return;
            }
            trapFocus(event);
        };

        document.addEventListener('keydown', keyHandler);
        nameInputRef.current?.focus();

        return () => {
            document.removeEventListener('keydown', keyHandler);
        };
    }, [isOpen, requestClose]);

    const handleOverlayMouseDown = (event) => {
        if (event.target === event.currentTarget) {
            requestClose();
        }
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setAttemptedSubmit(true);
        setError('');

        if (!name.trim()) {
            setError('Project Name is required.');
            return;
        }

        if (dateError) {
            setError(dateError);
            return;
        }

        setLoading(true);
        try {
            const tags = Array.from(
                new Set(
                    [priority.toLowerCase(), projectLabel.trim()]
                        .map((value) => String(value || '').trim())
                        .filter(Boolean)
                )
            );

            const payload = {
                name: name.trim(),
                description: description.trim(),
                workspaceId,
                status,
                priority,
                tags,
                startDate: startDate || undefined,
                dueDate: endDate || undefined,
                members: isAdminOrOwner
                    ? Object.entries(selectedMembers).map(([user, role]) => ({ user, role }))
                    : [],
                projectColor,
                calendarEnabled,
            };

            const res = await axios.post('/api/projects', payload);
            const createdProject = res.data;

            onCreated?.(createdProject);
            toast.success('Project created successfully');
            emitProjectDataChanged({
                workspaceId,
                projectId: createdProject?._id,
                source: 'create-project-modal',
            });
            resetForm();
            onClose?.();
            navigate(`/projects/${createdProject._id}`);
        } catch (err) {
            setError(err?.response?.data?.message || 'Failed to create project. Please try again.');
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <>
            <div
                className="fixed inset-0 z-50 bg-black/55 backdrop-blur-sm flex items-center justify-center px-4"
                onMouseDown={handleOverlayMouseDown}
                aria-hidden={false}
            >
                <div
                    ref={modalRef}
                    role="dialog"
                    aria-modal="true"
                    aria-label="Create Project"
                    className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl max-h-[85vh] overflow-y-auto"
                >
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
                    <h2 className="text-lg font-bold text-gray-900">Create Project</h2>
                    <button
                        type="button"
                        onClick={requestClose}
                        className="w-8 h-8 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 flex items-center justify-center"
                        aria-label="Close create project modal"
                    >
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Project Name *</label>
                        <input
                            ref={nameInputRef}
                            type="text"
                            placeholder="Website Redesign"
                            className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                        {attemptedSubmit && !name.trim() && (
                            <p className="mt-1 text-xs text-red-600">Project Name is required.</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Description</label>
                        <textarea
                            rows={3}
                            placeholder="Describe the goal and scope of this project"
                            className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all resize-y"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Status</label>
                            <select
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                                className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white"
                            >
                                {STATUS_OPTIONS.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Priority</label>
                            <div className="w-full border-2 border-gray-200 rounded-xl p-1 flex gap-1 bg-white">
                                {PRIORITY_OPTIONS.map((option) => (
                                    <button
                                        key={option}
                                        type="button"
                                        onClick={() => setPriority(option)}
                                        className={`flex-1 text-xs font-semibold rounded-lg py-2 transition ${
                                            priority === option
                                                ? 'bg-indigo-600 text-white'
                                                : 'text-gray-600 hover:bg-gray-100'
                                        }`}
                                    >
                                        {option}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div>
                        <p className="text-xs font-semibold text-gray-700 mb-2">Timeline</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs text-gray-600 mb-1">Start Date</label>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-600 mb-1">End Date</label>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                />
                            </div>
                        </div>
                        <p className="mt-1 text-[11px] text-gray-500">Shown as project deadline in Workspace Calendar</p>
                        {!!dateError && <p className="mt-1 text-xs text-red-600">{dateError}</p>}
                    </div>

                    <div>
                        <p className="text-xs font-semibold text-gray-700 mb-1">Project Members</p>
                        {isAdminOrOwner ? (
                            <>
                                <button
                                    type="button"
                                    onClick={() => setIsMemberPickerOpen((v) => !v)}
                                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-left text-sm bg-white flex items-center justify-between"
                                >
                                    <span className="truncate text-gray-700">
                                        {selectedList.length === 0
                                            ? 'Select members'
                                            : selectedList.map((m) => m.fullname).join(', ')}
                                    </span>
                                    {isMemberPickerOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                </button>

                                {isMemberPickerOpen && (
                                    <div className="mt-2 border border-gray-200 rounded-xl overflow-hidden bg-white max-h-56 overflow-y-auto">
                                        {members.map((m) => {
                                            const id = m.user._id;
                                            const checked = !!selectedMembers[id];
                                            const role = selectedMembers[id] || 'Contributor';

                                            return (
                                                <div key={id} className="px-3 py-2.5 border-b border-gray-100 last:border-b-0 flex items-center justify-between gap-2">
                                                    <label className="flex items-center gap-2 text-sm text-gray-700">
                                                        <input
                                                            type="checkbox"
                                                            checked={checked}
                                                            onChange={() => toggleMember(id)}
                                                            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                                        />
                                                        {m.user.fullname}
                                                    </label>

                                                    <select
                                                        value={role}
                                                        onChange={(e) => updateMemberRole(id, e.target.value)}
                                                        disabled={!checked}
                                                        className="text-xs border border-gray-200 rounded-lg px-2 py-1 disabled:bg-gray-100"
                                                    >
                                                        <option value="Manager">Manager</option>
                                                        <option value="Contributor">Contributor</option>
                                                        <option value="Viewer">Viewer</option>
                                                    </select>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="border-2 border-gray-200 bg-gray-50 rounded-xl px-4 py-3 text-sm text-gray-400 cursor-not-allowed">
                                Project members are managed by admins
                            </div>
                        )}
                    </div>

                    {isAdminOrOwner && (
                        <div className="border border-gray-200 rounded-xl p-3">
                            <button
                                type="button"
                                onClick={() => setShowAdvanced((v) => !v)}
                                className="w-full flex items-center justify-between text-sm font-semibold text-gray-700"
                            >
                                <span>Advanced Options</span>
                                {showAdvanced ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </button>

                            {showAdvanced && (
                                <div className="mt-3 space-y-3">
                                    <div>
                                        <p className="text-xs text-gray-600 mb-1">Project Color</p>
                                        <div className="flex items-center gap-2 flex-wrap">
                                            {COLOR_OPTIONS.map((color) => (
                                                <button
                                                    key={color}
                                                    type="button"
                                                    onClick={() => setProjectColor(color)}
                                                    className={`w-7 h-7 rounded-full border-2 ${
                                                        projectColor === color ? 'border-gray-900' : 'border-transparent'
                                                    }`}
                                                    style={{ backgroundColor: color }}
                                                    aria-label={`Select ${color} project color`}
                                                />
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs text-gray-600 mb-1">Project Label</label>
                                        <input
                                            type="text"
                                            value={projectLabel}
                                            onChange={(e) => setProjectLabel(e.target.value)}
                                            placeholder="Client, team, or category"
                                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                        />
                                    </div>

                                    <label className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2 text-sm">
                                        <span className="text-gray-700">Enable project calendar</span>
                                        <input
                                            type="checkbox"
                                            checked={calendarEnabled}
                                            onChange={(e) => setCalendarEnabled(e.target.checked)}
                                            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                        />
                                    </label>
                                </div>
                            )}
                        </div>
                    )}

                    {!!error && (
                        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                            {error}
                        </div>
                    )}

                    <div className="pt-1 flex items-center justify-end gap-3">
                        <button
                            type="button"
                            onClick={requestClose}
                            className="px-4 py-2.5 rounded-lg border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            disabled={!canSubmit}
                            className={`px-4 py-2.5 rounded-lg text-sm font-semibold text-white transition ${
                                canSubmit
                                    ? 'bg-indigo-600 hover:bg-indigo-700'
                                    : 'bg-indigo-300 cursor-not-allowed'
                            }`}
                        >
                            {loading ? 'Creating...' : 'Create Project'}
                        </button>
                    </div>
                </form>
                </div>
            </div>

            <ConfirmModal
                isOpen={showDiscardConfirm}
                title="Discard Changes"
                message="You have unsaved changes. Are you sure you want to discard them?"
                confirmText="Discard"
                cancelText="Keep Editing"
                variant="danger"
                onClose={() => setShowDiscardConfirm(false)}
                onConfirm={confirmDiscardAndClose}
            />
        </>
    );
};

export default CreateProjectModal;
