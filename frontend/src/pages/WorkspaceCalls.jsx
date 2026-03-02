import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
    Video,
    Phone,
    Calendar,
    Users,
    Link2,
    X,
    Sparkles,
} from 'lucide-react';
import useWorkspaceStore from '../store/useWorkspaceStore';

const createMeetingCode = () => {
    const randomChunk = Math.random().toString(36).slice(2, 5).toUpperCase();
    return `TM-${Date.now().toString(36).slice(-6).toUpperCase()}-${randomChunk}`;
};

const WorkspaceCalls = () => {
    const navigate = useNavigate();
    const { currentWorkspaceId, selectedWorkspace } = useWorkspaceStore();
    const [quickCallValue, setQuickCallValue] = useState('');
    const [generatedMeetingCode, setGeneratedMeetingCode] = useState(() => createMeetingCode());

    const workspaceMembers = selectedWorkspace?.workspace?.members || [];
    const workspaceName = selectedWorkspace?.workspace?.name || 'Workspace';

    const normalizedQuickValue = quickCallValue.trim().toUpperCase();
    const resolvedMeetingCode = normalizedQuickValue || generatedMeetingCode;
    const currentCallLink = useMemo(() => {
        const baseUrl = globalThis?.location?.origin || '';
        return `${baseUrl}/calls/${resolvedMeetingCode}`;
    }, [resolvedMeetingCode]);

    const openMeeting = () => {
        navigate(`/calls/${resolvedMeetingCode}`);
        if (!normalizedQuickValue) {
            setGeneratedMeetingCode(createMeetingCode());
        }
    };

    const handleStartVideoMeeting = () => {
        openMeeting();
    };

    const handleStartAudioMeeting = () => {
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
                        <p className="text-sm text-gray-500 mt-1">
                            Start a live room for {workspaceName} and share the link with your team.
                        </p>
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

                    <div className="mt-4 rounded-xl border border-indigo-100 bg-indigo-50/70 p-4">
                        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                            <div>
                                <p className="text-sm font-semibold text-indigo-900">Current meeting link</p>
                                <p className="mt-1 text-sm text-indigo-700 break-all">{currentCallLink}</p>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-indigo-800">
                                <span className="inline-flex items-center gap-1 rounded-full bg-white/80 px-2.5 py-1 border border-indigo-100">
                                    <Users className="h-3.5 w-3.5" />
                                    {workspaceMembers.length} workspace members
                                </span>
                                <span className="inline-flex items-center gap-1 rounded-full bg-white/80 px-2.5 py-1 border border-indigo-100">
                                    <Sparkles className="h-3.5 w-3.5" />
                                    Share this link to join
                                </span>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <article className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm lg:order-2">
                        <h3 className="text-lg font-semibold text-gray-900 inline-flex items-center gap-2">
                            <Calendar className="h-4.5 w-4.5 text-indigo-500" />
                            Scheduled Meetings
                        </h3>

                        <div className="mt-4 rounded-xl border border-dashed border-gray-300 bg-gray-50/60 p-5 text-center">
                            <p className="text-sm font-semibold text-gray-700">No scheduled meetings yet</p>
                            <p className="mt-1 text-sm text-gray-500">
                                This workspace does not store planned meetings yet. Start a room above and share its link manually.
                            </p>
                        </div>
                    </article>

                    <article className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm lg:order-3">
                        <h3 className="text-lg font-semibold text-gray-900 inline-flex items-center gap-2">
                            <Phone className="h-4.5 w-4.5 text-indigo-500" />
                            Recent Calls
                        </h3>

                        <div className="mt-4 rounded-xl border border-dashed border-gray-300 bg-gray-50/60 p-5 text-center">
                            <p className="text-sm font-semibold text-gray-700">No call history yet</p>
                            <p className="mt-1 text-sm text-gray-500">
                                Call history is not persisted in the app yet, so only live room joining is available right now.
                            </p>
                        </div>
                    </article>
                </section>
            </div>
        </div>
    );
};

export default WorkspaceCalls;
