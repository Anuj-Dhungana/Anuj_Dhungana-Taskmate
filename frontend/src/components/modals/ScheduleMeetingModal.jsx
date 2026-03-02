import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Clock3, FolderKanban, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../api';

const buildInitialDate = () => {
    const value = new Date();
    value.setMinutes(value.getMinutes() < 30 ? 30 : 0, 0, 0);
    if (value.getMinutes() === 0) {
        value.setHours(value.getHours() + 1);
    }
    return value;
};

const toDateInputValue = (value) => {
    const year = value.getFullYear();
    const month = `${value.getMonth() + 1}`.padStart(2, '0');
    const day = `${value.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const toTimeInputValue = (value) => {
    const hours = `${value.getHours()}`.padStart(2, '0');
    const minutes = `${value.getMinutes()}`.padStart(2, '0');
    return `${hours}:${minutes}`;
};

const toDurationInput = (totalMinutes) => {
    const safeMinutes = Number.isFinite(Number(totalMinutes)) ? Math.max(0, Number(totalMinutes)) : 0;
    if (safeMinutes > 0 && safeMinutes % 60 === 0) {
        return {
            value: String(safeMinutes / 60),
            unit: 'hours',
        };
    }
    return {
        value: String(safeMinutes || 30),
        unit: 'minutes',
    };
};

const ScheduleMeetingModal = ({
    isOpen,
    onClose,
    workspaceId,
    projects = [],
    onScheduled,
    meeting = null,
}) => {
    const [title, setTitle] = useState('');
    const [meetingDate, setMeetingDate] = useState('');
    const [meetingTime, setMeetingTime] = useState('');
    const [durationValue, setDurationValue] = useState('30');
    const [durationUnit, setDurationUnit] = useState('minutes');
    const [projectId, setProjectId] = useState('');
    const [description, setDescription] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const isEditMode = Boolean(meeting?._id);

    useEffect(() => {
        if (!isOpen) return;
        if (meeting?._id) {
            const startsAt = new Date(meeting.startsAt);
            const durationInput = toDurationInput(meeting.durationMinutes);
            setTitle(meeting.title || '');
            setMeetingDate(toDateInputValue(startsAt));
            setMeetingTime(toTimeInputValue(startsAt));
            setDurationValue(durationInput.value);
            setDurationUnit(durationInput.unit);
            setProjectId(meeting?.project?._id || '');
            setDescription(meeting.description || '');
        } else {
            const initialDate = buildInitialDate();
            setTitle('');
            setMeetingDate(toDateInputValue(initialDate));
            setMeetingTime(toTimeInputValue(initialDate));
            setDurationValue('30');
            setDurationUnit('minutes');
            setProjectId('');
            setDescription('');
        }
        setIsSaving(false);
    }, [isOpen, meeting]);

    const selectedProject = useMemo(
        () => projects.find((project) => String(project?._id) === String(projectId)) || null,
        [projectId, projects]
    );

    if (!isOpen) return null;

    const handleSubmit = async (event) => {
        event.preventDefault();

        const trimmedTitle = title.trim();
        if (!trimmedTitle) {
            toast.error('Meeting title is required');
            return;
        }

        if (!meetingDate || !meetingTime) {
            toast.error('Meeting date and time are required');
            return;
        }

        const startsAt = new Date(`${meetingDate}T${meetingTime}:00`);
        if (Number.isNaN(startsAt.getTime())) {
            toast.error('Invalid meeting date or time');
            return;
        }
        if (startsAt.getTime() < Date.now() - 60 * 1000) {
            toast.error('Meetings must be scheduled in the future');
            return;
        }

        const parsedDurationValue = Number(durationValue);
        if (!Number.isInteger(parsedDurationValue) || parsedDurationValue <= 0) {
            toast.error('Duration must be a valid number');
            return;
        }
        const durationMinutes =
            durationUnit === 'hours' ? parsedDurationValue * 60 : parsedDurationValue;
        if (durationMinutes <= 0) {
            toast.error('Duration must be greater than 0');
            return;
        }

        setIsSaving(true);
        try {
            const payload = {
                workspaceId,
                projectId: projectId || undefined,
                title: trimmedTitle,
                startsAt: startsAt.toISOString(),
                durationMinutes,
                description: description.trim(),
            };
            const response = isEditMode
                ? await api.put(`/api/meetings/${meeting._id}`, payload)
                : await api.post('/api/meetings', payload);

            toast.success(isEditMode ? 'Meeting updated successfully.' : 'Meeting scheduled successfully.');
            onScheduled?.(response.data);
            onClose?.();
        } catch (error) {
            toast.error(
                error?.response?.data?.message
                    || (isEditMode ? 'Failed to update meeting' : 'Failed to schedule meeting')
            );
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 px-4 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="w-full max-w-2xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl"
                onClick={(event) => event.stopPropagation()}
            >
                <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">
                            {isEditMode ? 'Edit Scheduled Meeting' : 'Schedule a Meeting'}
                        </h2>
                        <p className="mt-1 text-sm text-slate-500">
                            {isEditMode
                                ? 'Update the meeting details for your workspace or linked project.'
                                : 'Create a meeting for your workspace or a specific project.'}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6 px-6 py-5">
                    <section className="space-y-4">
                        <div>
                            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                                Basic Info
                            </div>
                        </div>

                        <div>
                            <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                                Meeting Title
                            </label>
                            <input
                                type="text"
                                value={title}
                                onChange={(event) => setTitle(event.target.value)}
                                placeholder="Sprint planning, client review, weekly sync..."
                                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-200 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                                required
                            />
                        </div>

                        <div className="grid gap-3 md:grid-cols-3">
                            <div>
                                <label className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-slate-700">
                                    <CalendarDays className="h-4 w-4 text-indigo-500" />
                                    Date
                                </label>
                                <input
                                    type="date"
                                    value={meetingDate}
                                    onChange={(event) => setMeetingDate(event.target.value)}
                                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-200 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                                    required
                                />
                            </div>

                            <div>
                                <label className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-slate-700">
                                    <Clock3 className="h-4 w-4 text-indigo-500" />
                                    Time
                                </label>
                                <input
                                    type="time"
                                    value={meetingTime}
                                    onChange={(event) => setMeetingTime(event.target.value)}
                                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-200 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                                    required
                                />
                            </div>

                            <div>
                                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                                    Duration
                                </label>
                                <div className="grid max-w-[250px] grid-cols-[78px_1fr] gap-2">
                                    <input
                                        type="number"
                                        min="1"
                                        step="1"
                                        inputMode="numeric"
                                        value={durationValue}
                                        onChange={(event) => setDurationValue(event.target.value)}
                                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-200 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                                        placeholder="30"
                                    />
                                    <select
                                        value={durationUnit}
                                        onChange={(event) => setDurationUnit(event.target.value)}
                                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-200 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                                    >
                                        <option value="minutes">minutes</option>
                                        <option value="hours">hours</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="space-y-4">
                        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                            Project Link
                        </div>

                        <div>
                            <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                                Link to Project (optional)
                            </label>
                            <select
                                value={projectId}
                                onChange={(event) => setProjectId(event.target.value)}
                                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-200 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                            >
                                <option value="">None</option>
                                {projects.map((project) => (
                                    <option key={project._id} value={project._id}>
                                        {project.name}
                                    </option>
                                ))}
                            </select>

                            {selectedProject ? (
                                <div className="mt-3 space-y-2">
                                    <p className="text-xs text-slate-500">
                                        This meeting will appear in both Workspace and Project calendars.
                                    </p>
                                    <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                                        <FolderKanban className="h-3.5 w-3.5" />
                                        Project: {selectedProject.name}
                                    </div>
                                </div>
                            ) : null}
                        </div>
                    </section>

                    <section className="space-y-4">
                        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                            Description
                        </div>

                        <div>
                            <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                                Meeting agenda / notes
                            </label>
                            <textarea
                                value={description}
                                onChange={(event) => setDescription(event.target.value)}
                                placeholder="Outline talking points, goals, or prep notes for the team."
                                className="h-28 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-200 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                            />
                        </div>
                    </section>

                    <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-5">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {isSaving
                                ? (isEditMode ? 'Saving...' : 'Scheduling...')
                                : (isEditMode ? 'Save Changes' : 'Schedule Meeting')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ScheduleMeetingModal;
