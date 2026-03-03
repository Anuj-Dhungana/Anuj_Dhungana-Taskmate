import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import {
    Video,
    Calendar,
    Link2,
    X,
    Plus,
    Clock3,
    FolderKanban,
    Pencil,
    Trash2,
} from 'lucide-react';
import api from '../api';
import useWorkspaceStore from '../store/useWorkspaceStore';
import ScheduleMeetingModal from '../components/modals/ScheduleMeetingModal';
import ConfirmModal from '../components/modals/ConfirmModal';

const createMeetingCode = () => {
    const randomChunk = Math.random().toString(36).slice(2, 5).toUpperCase();
    return `TM-${Date.now().toString(36).slice(-6).toUpperCase()}-${randomChunk}`;
};

const sortMeetings = (meetings) =>
    [...meetings].sort(
        (left, right) => new Date(left?.startsAt).getTime() - new Date(right?.startsAt).getTime()
    );

const WorkspaceCalls = () => {
    const navigate = useNavigate();
    const { currentWorkspaceId, selectedWorkspace } = useWorkspaceStore();
    const [quickCallValue, setQuickCallValue] = useState('');
    const [generatedMeetingCode, setGeneratedMeetingCode] = useState(() => createMeetingCode());
    const [scheduledMeetings, setScheduledMeetings] = useState([]);
    const [meetingsLoading, setMeetingsLoading] = useState(false);
    const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
    const [editingMeeting, setEditingMeeting] = useState(null);
    const [meetingToDelete, setMeetingToDelete] = useState(null);
    const [isDeletingMeeting, setIsDeletingMeeting] = useState(false);

    const workspaceName = selectedWorkspace?.workspace?.name || 'Workspace';
    const projects = Array.isArray(selectedWorkspace?.projects) ? selectedWorkspace.projects : [];

    const normalizedQuickValue = quickCallValue.trim().toUpperCase();
    const resolvedMeetingCode = normalizedQuickValue || generatedMeetingCode;
    const currentCallLink = useMemo(() => {
        const baseUrl = globalThis?.location?.origin || '';
        return `${baseUrl}/calls/${resolvedMeetingCode}`;
    }, [resolvedMeetingCode]);
    const upcomingMeetings = useMemo(
        () => scheduledMeetings.filter((meeting) => {
            const endTime = new Date(meeting?.endsAt || meeting?.startsAt || 0).getTime();
            return Number.isFinite(endTime) && endTime >= Date.now();
        }),
        [scheduledMeetings]
    );

    const fetchMeetings = useCallback(async () => {
        if (!currentWorkspaceId) {
            setScheduledMeetings([]);
            setMeetingsLoading(false);
            return;
        }
        setMeetingsLoading(true);
        try {
            const response = await api.get(`/api/meetings?workspaceId=${currentWorkspaceId}`);
            setScheduledMeetings(sortMeetings(response.data || []));
        } catch (error) {
            console.error('Failed to load meetings', error);
            toast.error(error?.response?.data?.message || 'Failed to load scheduled meetings');
        } finally {
            setMeetingsLoading(false);
        }
    }, [currentWorkspaceId]);

    useEffect(() => {
        fetchMeetings();
    }, [fetchMeetings]);

    const openMeeting = () => {
        navigate(`/calls/${resolvedMeetingCode}`);
        if (!normalizedQuickValue) {
            setGeneratedMeetingCode(createMeetingCode());
        }
    };

    const handleStartVideoMeeting = () => {
        openMeeting();
    };

    const handleCopyMeetingLink = async () => {
        try {
            await navigator.clipboard.writeText(currentCallLink);
            toast.success('Meeting link copied');
        } catch {
            toast.error('Failed to copy meeting link');
        }
    };

    const handleCopyMeetingCode = async (meetingCode) => {
        try {
            await navigator.clipboard.writeText(String(meetingCode || ''));
            toast.success('Meeting code copied');
        } catch {
            toast.error('Failed to copy meeting code');
        }
    };

    const handleMeetingScheduled = (meeting) => {
        setScheduledMeetings((currentMeetings) =>
            sortMeetings([
                meeting,
                ...currentMeetings.filter(
                    (currentMeeting) => String(currentMeeting?._id) !== String(meeting?._id)
                ),
            ])
        );
    };

    const handleOpenCreateModal = () => {
        setEditingMeeting(null);
        setIsScheduleModalOpen(true);
    };

    const handleOpenEditModal = (meeting) => {
        setEditingMeeting(meeting);
        setIsScheduleModalOpen(true);
    };

    const handleCloseScheduleModal = () => {
        setIsScheduleModalOpen(false);
        setEditingMeeting(null);
    };

    const handleOpenDeleteModal = (meeting) => {
        setMeetingToDelete(meeting);
    };

    const handleCloseDeleteModal = () => {
        if (isDeletingMeeting) return;
        setMeetingToDelete(null);
    };

    const handleDeleteMeeting = async () => {
        if (!meetingToDelete?._id) return;

        setIsDeletingMeeting(true);
        try {
            await api.delete(`/api/meetings/${meetingToDelete._id}`);
            setScheduledMeetings((currentMeetings) =>
                currentMeetings.filter(
                    (currentMeeting) => String(currentMeeting?._id) !== String(meetingToDelete?._id)
                )
            );
            toast.success('Meeting deleted successfully.');
            setMeetingToDelete(null);
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Failed to delete meeting');
        } finally {
            setIsDeletingMeeting(false);
        }
    };

    if (!currentWorkspaceId) {
        return (
            <div className="px-8 py-10">
                <div className="mx-auto max-w-6xl text-center text-gray-500">Select a workspace to manage calls.</div>
            </div>
        );
    }

    return (
        <div className="px-6 md:px-8 py-7 bg-gray-50/30 min-h-screen">
            <div className="mx-auto max-w-6xl space-y-5">
                <header>
                    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Calls & Meetings</h1>
                            <p className="text-sm text-gray-500 mt-1">
                                Start a live room for {workspaceName} and share the link with your team.
                            </p>
                        </div>
                    </div>
                </header>

                <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                    <h2 className="text-lg font-semibold text-gray-900">Start or Join Meeting</h2>

                    <div className="mt-4 flex flex-col lg:flex-row gap-2.5">
                        <div className="relative flex-1">
                            <input
                                type="text"
                                value={quickCallValue}
                                onChange={(event) => setQuickCallValue(event.target.value)}
                                placeholder="Enter meeting code"
                                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 pr-20 text-sm text-gray-800 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-200"
                            />
                            <div className="absolute inset-y-0 right-2 flex items-center gap-1">
                                {quickCallValue ? (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setQuickCallValue('');
                                            setGeneratedMeetingCode(createMeetingCode());
                                        }}
                                        className="h-7 w-7 rounded-md text-gray-500 hover:bg-gray-100 inline-flex items-center justify-center"
                                        title="Clear"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                ) : null}
                                <button
                                    type="button"
                                    onClick={handleCopyMeetingLink}
                                    className="h-7 w-7 rounded-md text-gray-500 hover:bg-gray-100 inline-flex items-center justify-center"
                                    title="Copy meeting link"
                                >
                                    <Link2 className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={handleStartVideoMeeting}
                                className="inline-flex items-center gap-2 rounded-lg bg-indigo-500 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-600 transition"
                            >
                                <Video className="h-4 w-4" />
                                Start Video Meeting
                            </button>
                        </div>
                    </div>

                </section>

                <section>
                    <article className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                        <div className="flex items-center justify-between gap-3">
                            <h3 className="text-lg font-semibold text-gray-900 inline-flex items-center gap-2">
                                <Calendar className="h-4.5 w-4.5 text-indigo-500" />
                                Scheduled Meetings
                            </h3>
                            <div className="flex items-center gap-2">
                                <span className="rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-semibold text-gray-500">
                                    {upcomingMeetings.length} upcoming
                                </span>
                                <button
                                    type="button"
                                    onClick={handleOpenCreateModal}
                                    className="inline-flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-100"
                                >
                                    <Plus className="h-4 w-4" />
                                    Schedule Meeting
                                </button>
                            </div>
                        </div>

                        {meetingsLoading ? (
                            <div className="mt-4 rounded-xl border border-dashed border-gray-300 bg-gray-50/60 p-5 text-center">
                                <p className="text-sm font-semibold text-gray-700">Loading meetings...</p>
                            </div>
                        ) : upcomingMeetings.length === 0 ? (
                            <div className="mt-4 rounded-xl border border-dashed border-gray-300 bg-gray-50/60 p-5 text-center">
                                <p className="text-sm font-semibold text-gray-700">No scheduled meetings yet</p>
                                <p className="mt-1 text-sm text-gray-500">
                                    Schedule a workspace sync, sprint planning session, or project review.
                                </p>
                            </div>
                        ) : (
                            <div className="mt-4 space-y-3">
                                {upcomingMeetings.map((meeting) => (
                                    <div
                                        key={meeting._id}
                                        className="rounded-2xl border border-gray-200 bg-gradient-to-r from-white via-white to-indigo-50/60 p-4"
                                    >
                                        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                                            <div className="min-w-0">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <h4 className="text-base font-semibold text-gray-900">
                                                        {meeting.title}
                                                    </h4>
                                                    {meeting?.project?.name ? (
                                                        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                                                            <FolderKanban className="h-3.5 w-3.5" />
                                                            {meeting.project.name}
                                                        </span>
                                                    ) : null}
                                                </div>

                                                <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-gray-500">
                                                    <span className="inline-flex items-center gap-1.5">
                                                        <Calendar className="h-4 w-4 text-indigo-500" />
                                                        {format(new Date(meeting.startsAt), 'EEE, MMM d, yyyy')}
                                                    </span>
                                                    <span className="inline-flex items-center gap-1.5">
                                                        <Clock3 className="h-4 w-4 text-indigo-500" />
                                                        {format(new Date(meeting.startsAt), 'h:mm a')} - {format(new Date(meeting.endsAt), 'h:mm a')}
                                                    </span>
                                                </div>

                                                {meeting.description ? (
                                                    <p className="mt-3 max-w-3xl text-sm text-gray-600">
                                                        {meeting.description}
                                                    </p>
                                                ) : null}

                                                <div className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
                                                    Meeting code: {meeting.roomID}
                                                </div>
                                            </div>

                                            <div className="flex shrink-0 items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => handleOpenEditModal(meeting)}
                                                    className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                    Edit
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleOpenDeleteModal(meeting)}
                                                    className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                    Delete
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleCopyMeetingCode(meeting.roomID)}
                                                    className="rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                                                >
                                                    Copy Code
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => navigate(`/calls/${meeting.roomID}`)}
                                                    className="rounded-xl bg-indigo-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
                                                >
                                                    Join Meeting
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </article>
                </section>
            </div>

            <ScheduleMeetingModal
                isOpen={isScheduleModalOpen}
                onClose={handleCloseScheduleModal}
                workspaceId={currentWorkspaceId}
                projects={projects}
                onScheduled={handleMeetingScheduled}
                meeting={editingMeeting}
            />
            <ConfirmModal
                isOpen={Boolean(meetingToDelete)}
                title="Delete Scheduled Meeting"
                message={`Are you sure you want to delete "${meetingToDelete?.title || 'this meeting'}"? This action cannot be undone.`}
                confirmText="Delete Meeting"
                cancelText="Cancel"
                variant="danger"
                onConfirm={handleDeleteMeeting}
                onClose={handleCloseDeleteModal}
                loading={isDeletingMeeting}
            />
        </div>
    );
};

export default WorkspaceCalls;
