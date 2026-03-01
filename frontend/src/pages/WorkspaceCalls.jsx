import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
    Video,
    Phone,
    Calendar,
    Clock3,
    Users,
    Link2,
    X,
    MoreVertical,
    PhoneCall,
} from 'lucide-react';
import useWorkspaceStore from '../store/useWorkspaceStore';
import useAuthStore from '../store/useAuthStore';

const WorkspaceCalls = () => {
    const navigate = useNavigate();
    const { currentWorkspaceId, selectedWorkspace } = useWorkspaceStore();
    const userInfo = useAuthStore((state) => state.userInfo);
    const [quickCallValue, setQuickCallValue] = useState('');
    const [menuOpenFor, setMenuOpenFor] = useState('');

    const recentCalls = [
        {
            name: 'Sita Sharma',
            time: '2 hours ago',
            duration: '45 min',
            status: 'completed',
            participants: 3,
            type: 'Video',
        },
        {
            name: 'Rajesh Thapa',
            time: 'Yesterday',
            duration: '12 min',
            status: 'ongoing',
            participants: 2,
            type: 'Audio',
        },
        {
            name: 'Team Standup',
            time: '2 days ago',
            duration: '30 min',
            status: 'missed',
            participants: 8,
            type: 'Video',
        },
    ];

    const scheduledMeetings = [
        {
            title: 'Sprint Planning',
            schedule: 'Today, 2:00 PM',
            duration: '1 hour',
            participants: 8,
            code: 'TM-4829-ABX',
            startingSoon: true,
            canJoinNow: true,
            startsInHours: 0,
        },
        {
            title: 'Client Review',
            schedule: 'Tomorrow, 10:00 AM',
            duration: '45 min',
            participants: 5,
            code: 'TM-6701-KLT',
            startingSoon: false,
            canJoinNow: false,
            startsInHours: 18,
        },
        {
            title: 'Team Sync',
            schedule: 'Friday, 3:00 PM',
            duration: '30 min',
            participants: 12,
            code: 'TM-9088-QWP',
            startingSoon: false,
            canJoinNow: false,
            startsInHours: 54,
        },
    ];

    const activeMeeting = {
        code: 'TM-2207-ZMX',
        startedBy: 'Anuj',
        participants: 4,
    };

    const workspaceMembers = selectedWorkspace?.workspace?.members || [];
    const myRole = workspaceMembers.find((member) => {
        const id = String(member?.user?._id || member?.user || '');
        return id === String(userInfo?._id || '');
    })?.role;
    const canManageMeetings = myRole === 'owner' || myRole === 'admin';

    const normalizedQuickValue = quickCallValue.trim();
    const generatedMeetingCode = (normalizedQuickValue || 'TM-4829-ABX').toUpperCase();

    const recentStatusBadge = (status) => {
        if (status === 'completed') return 'bg-emerald-100 text-emerald-700';
        if (status === 'ongoing') return 'bg-amber-100 text-amber-700';
        return 'bg-red-100 text-red-700';
    };

    const recentStatusLabel = (status) => {
        if (status === 'completed') return 'Completed';
        if (status === 'ongoing') return 'Ongoing';
        return 'Missed';
    };

    const handleStartVideoMeeting = () => {
        navigate(`/calls/${generatedMeetingCode}`);
    };

    const handleStartAudioMeeting = () => {
        navigate(`/calls/${generatedMeetingCode}`);
    };

    const handleCopyMeetingLink = async () => {
        try {
            const baseUrl = globalThis?.location?.origin || '';
            const value = `${baseUrl}/calls/${generatedMeetingCode}`;
            await navigator.clipboard.writeText(value);
            toast.success('Meeting link copied');
        } catch {
            toast.error('Failed to copy meeting link');
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
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Calls & Meetings</h1>
                        <p className="text-sm text-gray-500 mt-1">Connect with your team instantly</p>
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
                                placeholder="Enter meeting name or code"
                                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 pr-20 text-sm text-gray-800 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-200"
                            />
                            <div className="absolute inset-y-0 right-2 flex items-center gap-1">
                                {quickCallValue ? (
                                    <button
                                        type="button"
                                        onClick={() => setQuickCallValue('')}
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
                            <button
                                type="button"
                                onClick={handleStartAudioMeeting}
                                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
                            >
                                <Phone className="h-4 w-4" />
                                Start Audio Only
                            </button>
                        </div>
                    </div>

                </section>

                {activeMeeting ? (
                    <section className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 md:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div>
                            <p className="text-sm font-semibold text-emerald-900">Meeting in Progress</p>
                            <p className="text-sm text-emerald-700 mt-0.5">
                                Started by {activeMeeting.startedBy} • {activeMeeting.participants} participants
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => navigate(`/calls/${activeMeeting.code}`)}
                            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 transition"
                        >
                            <PhoneCall className="h-4 w-4" />
                            Join Now
                        </button>
                    </section>
                ) : null}

                <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <article className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm lg:order-2">
                        <h3 className="text-lg font-semibold text-gray-900 inline-flex items-center gap-2">
                            <Calendar className="h-4.5 w-4.5 text-indigo-500" />
                            Scheduled Meetings
                        </h3>

                        <div className="mt-4 space-y-3.5">
                            {scheduledMeetings.map((meeting) => {
                                const isStartingSoon = meeting.startingSoon;
                                const canJoinNow = meeting.canJoinNow;
                                const startsInHours = meeting.startsInHours;

                                return (
                                    <div key={meeting.code} className="rounded-xl border border-gray-200 bg-gray-50/40 p-4">
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <p className="text-lg font-semibold text-gray-900">{meeting.title}</p>
                                                    {isStartingSoon ? (
                                                        <span className="inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                                                            Starting Soon
                                                        </span>
                                                    ) : null}
                                                </div>
                                                <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-gray-500">
                                                    <span className="inline-flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{meeting.schedule}</span>
                                                    <span className="inline-flex items-center gap-1"><Clock3 className="h-3.5 w-3.5" />{meeting.duration}</span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-1.5">
                                                <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-2 py-0.5 text-xs text-gray-600">
                                                    <Users className="h-3.5 w-3.5" />
                                                    {meeting.participants}
                                                </span>
                                                {canManageMeetings ? (
                                                    <div className="relative">
                                                        <button
                                                            type="button"
                                                            onClick={() => setMenuOpenFor((prev) => (prev === meeting.code ? '' : meeting.code))}
                                                            className="h-7 w-7 rounded-md border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 inline-flex items-center justify-center"
                                                            title="More actions"
                                                        >
                                                            <MoreVertical className="h-4 w-4" />
                                                        </button>
                                                        {menuOpenFor === meeting.code ? (
                                                            <div className="absolute right-0 top-8 z-10 w-32 rounded-lg border border-gray-200 bg-white shadow-lg py-1 text-xs">
                                                                <button type="button" onClick={() => toast('Edit is UI only')} className="w-full text-left px-3 py-2 hover:bg-gray-50">Edit</button>
                                                                <button type="button" onClick={() => toast('Cancel is UI only')} className="w-full text-left px-3 py-2 hover:bg-gray-50">Cancel</button>
                                                                <button type="button" onClick={handleCopyMeetingLink} className="w-full text-left px-3 py-2 hover:bg-gray-50">Copy Link</button>
                                                            </div>
                                                        ) : null}
                                                    </div>
                                                ) : null}
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => navigate(`/calls/${meeting.code}`)}
                                            disabled={!canJoinNow}
                                            className="mt-3 w-full rounded-lg bg-indigo-500 text-white py-2.5 text-sm font-semibold hover:bg-indigo-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {canJoinNow ? 'Join Meeting' : `Starts in ${startsInHours}h`}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </article>

                    <article className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm lg:order-3">
                        <h3 className="text-lg font-semibold text-gray-900 inline-flex items-center gap-2">
                            <Phone className="h-4.5 w-4.5 text-indigo-500" />
                            Recent Calls
                        </h3>

                        <div className="mt-4 space-y-4">
                            {recentCalls.map((call) => (
                                <div key={`${call.name}-${call.time}`} className="flex items-center justify-between">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className={`h-8 w-8 rounded-full flex items-center justify-center ${call.type === 'Audio' ? 'bg-emerald-100 text-emerald-600' : 'bg-indigo-100 text-indigo-600'}`}>
                                            {call.type === 'Audio' ? <Phone className="h-4 w-4" /> : <Video className="h-4 w-4" />}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-base font-semibold text-gray-800 truncate">{call.name}</p>
                                            <p className="text-sm text-gray-500">{call.duration} • {call.participants} participants • {call.type}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm text-gray-500">{call.time}</p>
                                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${recentStatusBadge(call.status)}`}>
                                            {recentStatusLabel(call.status)}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </article>
                </section>
            </div>
        </div>
    );
};

export default WorkspaceCalls;
