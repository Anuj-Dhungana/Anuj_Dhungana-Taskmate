import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
    AlertCircle,
    Calendar as CalendarIcon,
    CheckCircle2,
    Clock,
    Copy,
    Flag,
    Users,
    Video,
    X,
} from 'lucide-react';
import TypeBadge from './TypeBadge';
import { formatEventDuration } from '../../utils/calendarHelpers';

const getInitials = (name) => {
    if (!name) return 'U';
    return name
        .split(' ')
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();
};

const EventDetailModal = ({ event, onClose }) => {
    const navigate = useNavigate();

    if (!event) return null;

    const meta = event.meta || {};
    const projectName = meta.projectName || event.resource?.projectId?.name || event.resource?.name;
    const listTitle = meta.listTitle || event.resource?.listId?.title;
    const priority = meta.priority || event.resource?.priority;
    const description = meta.description || event.resource?.description;
    const status = event.resource?.status;
    const isProjectEvent = event.source?.startsWith('project');
    const isMeetingEvent = event.type === 'meeting';
    const attendees =
        Array.isArray(meta.attendees) && meta.attendees.length > 0
            ? meta.attendees
            : Array.isArray(event.resource?.attendees)
                ? event.resource.attendees.map((attendee) => attendee?.user).filter(Boolean)
                : [];
    const meetingCode = meta.meetingCode || meta.roomID || event.resource?.roomID;

    const handleCopyMeetingCode = async () => {
        if (!meetingCode) return;
        try {
            await navigator.clipboard.writeText(String(meetingCode));
            toast.success('Meeting code copied');
        } catch {
            toast.error('Failed to copy meeting code');
        }
    };

    const handleJoinMeeting = () => {
        if (!meetingCode) return;
        navigate(`/calls/${meetingCode}`);
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
                onClick={(event) => event.stopPropagation()}
            >
                <div className="mb-4 flex items-center justify-between">
                    <TypeBadge type={event.type} />
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg p-1 text-gray-400 hover:bg-gray-100"
                    >
                        <X size={18} />
                    </button>
                </div>
                <h3 className="mb-3 text-lg font-bold text-gray-900">{event.title}</h3>

                <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                        <CalendarIcon size={14} />
                        <span>{format(event.start, 'EEEE, MMM d, yyyy')}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Clock size={14} />
                        <span>
                            {format(event.start, 'h:mm a')} - {format(event.end, 'h:mm a')}
                        </span>
                    </div>
                    {isMeetingEvent && (
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Clock size={14} />
                            <span>Duration: {formatEventDuration(event.start, event.end)}</span>
                        </div>
                    )}
                    {projectName && (
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Flag size={14} />
                            <span>Project: {projectName}</span>
                        </div>
                    )}
                    {listTitle && (
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                            <CheckCircle2 size={14} />
                            <span>List: {listTitle}</span>
                        </div>
                    )}
                    {priority && (
                        <div className="flex items-center gap-2 text-sm">
                            <AlertCircle
                                size={14}
                                className={
                                    priority === 'High'
                                        ? 'text-red-500'
                                        : priority === 'Medium'
                                            ? 'text-amber-500'
                                            : 'text-gray-400'
                                }
                            />
                            <span className="text-gray-500">Priority: {priority}</span>
                        </div>
                    )}
                    {isProjectEvent && status && (
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                            <AlertCircle size={14} className="text-indigo-500" />
                            <span>Status: {status}</span>
                        </div>
                    )}
                    {description && (
                        <div className="mt-3 rounded-xl bg-gray-50 p-3 text-sm text-gray-600">
                            {description}
                        </div>
                    )}
                    {isMeetingEvent && attendees.length > 0 && (
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                                <Users size={14} className="text-indigo-500" />
                                Participants
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {attendees.map((user) => (
                                    <div
                                        key={user?._id || user?.email || user?.fullname}
                                        className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-xs font-medium text-gray-700"
                                    >
                                        {user?.avatar ? (
                                            <img
                                                src={user.avatar}
                                                alt={user.fullname || 'User'}
                                                className="h-6 w-6 rounded-full object-cover"
                                            />
                                        ) : (
                                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-bold text-indigo-700">
                                                {getInitials(user?.fullname)}
                                            </div>
                                        )}
                                        <span>{user?.fullname || user?.email || 'Workspace member'}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    {isMeetingEvent && meetingCode && (
                        <div className="rounded-xl border border-indigo-100 bg-indigo-50 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-indigo-700">
                            Meeting Code: {meetingCode}
                        </div>
                    )}
                </div>

                {isMeetingEvent && meetingCode && (
                    <div className="mt-5 flex items-center justify-end gap-3">
                        <button
                            type="button"
                            onClick={handleCopyMeetingCode}
                            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                        >
                            <Copy size={14} />
                            Copy Meeting Code
                        </button>
                        <button
                            type="button"
                            onClick={handleJoinMeeting}
                            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
                        >
                            <Video size={14} />
                            Join Meeting
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default EventDetailModal;
