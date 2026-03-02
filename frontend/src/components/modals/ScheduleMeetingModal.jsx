import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Clock3, FolderKanban, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../api';

const DURATION_OPTIONS = [30, 45, 60, 90];

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

const ScheduleMeetingModal = ({ isOpen, onClose, workspaceId, projects = [], onScheduled }) => {
    const [title, setTitle] = useState('');
    const [meetingDate, setMeetingDate] = useState('');
    const [meetingTime, setMeetingTime] = useState('');
    const [durationMinutes, setDurationMinutes] = useState(60);
    const [projectId, setProjectId] = useState('');
    const [description, setDescription] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (!isOpen) return;
        const initialDate = buildInitialDate();
        setTitle('');
        setMeetingDate(toDateInputValue(initialDate));
        setMeetingTime(toTimeInputValue(initialDate));
        setDurationMinutes(60);
        setProjectId('');
        setDescription('');
        setIsSaving(false);
    }, [isOpen]);

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

        setIsSaving(true);
        try {
            const response = await api.post('/api/meetings', {
                workspaceId,
                projectId: projectId || undefined,
                title: trimmedTitle,
                startsAt: startsAt.toISOString(),
                durationMinutes,
                description: description.trim(),
            });

            toast.success('Meeting scheduled successfully.');
            onScheduled?.(response.data);
            onClose?.();
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Failed to schedule meeting');
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
                        <h2 className="text-xl font-bold text-slate-900">Schedule a Meeting</h2>
                        <p className="mt-1 text-sm text-slate-500">
                            Create a meeting for your workspace or a specific project.
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
                                <select
                                    value={durationMinutes}
                                    onChange={(event) => setDurationMinutes(Number(event.target.value))}
                                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-200 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                                >
                                    {DURATION_OPTIONS.map((value) => (
                                        <option key={value} value={value}>
                                            {value} minutes
                                        </option>
                                    ))}
                                </select>
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
                            {isSaving ? 'Scheduling...' : 'Schedule Meeting'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ScheduleMeetingModal;
