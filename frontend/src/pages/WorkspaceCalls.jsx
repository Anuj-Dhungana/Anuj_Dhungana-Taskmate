import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Video, KeyRound, VideoIcon, UsersRound } from 'lucide-react';
import useWorkspaceStore from '../store/useWorkspaceStore';

const WorkspaceCalls = () => {
    const navigate = useNavigate();
    const { currentWorkspaceId, selectedWorkspace } = useWorkspaceStore();
    const [meetingCode, setMeetingCode] = useState('');
    const [joinTouched, setJoinTouched] = useState(false);

    const workspaceName = selectedWorkspace?.workspace?.name || 'Dev Team';

    const activeMeeting = useMemo(() => ({
        id: 'TM-4829-ABX',
        startedBy: 'Anuj',
        participants: 4,
    }), []);

    const normalizedCode = meetingCode.trim().toUpperCase();
    const joinError = joinTouched && !normalizedCode ? 'Meeting code is required.' : '';

    const handleStartMeeting = () => {
        const randomCode = `TM-${Math.random().toString(36).slice(2, 6).toUpperCase()}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
        navigate(`/calls/${randomCode}`);
    };

    const handleJoinMeeting = () => {
        setJoinTouched(true);
        if (!normalizedCode) return;
        navigate(`/calls/${normalizedCode}`);
    };

    if (!currentWorkspaceId) {
        return (
            <div className="px-8 py-10">
                <div className="mx-auto max-w-275 text-center text-gray-500">Select a workspace to manage calls.</div>
            </div>
        );
    }

    return (
        <div className="px-6 md:px-8 py-8 md:py-10">
            <div className="mx-auto max-w-275 space-y-8 md:space-y-10">
                <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Workspace Meetings</h1>
                        <p className="text-sm md:text-base text-gray-500 mt-1">Start or join a meeting in your workspace</p>
                    </div>
                    <span className="inline-flex items-center rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-semibold text-gray-600 w-fit">
                        Workspace: {workspaceName}
                    </span>
                </header>

            

                {activeMeeting && (
                    <section className="rounded-2xl border border-green-200 bg-green-50 px-5 py-4 md:px-6 md:py-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-start gap-3">
                            <span className="mt-0.5 h-2.5 w-2.5 rounded-full bg-green-500" />
                            <div>
                                <p className="text-sm md:text-base font-semibold text-green-900">Meeting in Progress</p>
                                <p className="text-xs md:text-sm text-green-700">Started by {activeMeeting.startedBy} • {activeMeeting.participants} participants</p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => navigate(`/calls/${activeMeeting.id}`)}
                            className="px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-semibold hover:bg-green-700 transition-all duration-200 hover:scale-[1.02]"
                        >
                            Join Now
                        </button>
                    </section>
                )}

                <section className="grid grid-cols-1 lg:grid-cols-2 gap-5 md:gap-6">
                    <article className="rounded-xl border border-green-200 bg-white shadow-sm p-6 md:p-7 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
                        <div className="h-12 w-12 rounded-xl bg-green-100 text-green-700 flex items-center justify-center mb-4">
                            <Video className="w-6 h-6" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900">Start a New Meeting</h3>
                        <p className="mt-2 text-sm text-gray-500">Launch an instant video meeting for your workspace.</p>
                        <button
                            type="button"
                            onClick={handleStartMeeting}
                            className="mt-6 w-full rounded-lg bg-green-600 text-white font-semibold py-3 hover:bg-green-700 transition-all duration-200 hover:scale-[1.01] hover:shadow-md"
                        >
                            Start Meeting
                        </button>
                    </article>

                    <article className="rounded-xl border border-blue-200 bg-white shadow-sm p-6 md:p-7 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
                        <div className="h-12 w-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mb-4">
                            <KeyRound className="w-6 h-6" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900">Join with a Code</h3>
                        <p className="mt-2 text-sm text-gray-500">Enter a meeting code to join an ongoing session.</p>

                        <div className="mt-5">
                            <input
                                type="text"
                                value={meetingCode}
                                onChange={(event) => {
                                    setMeetingCode(event.target.value.toUpperCase());
                                    if (joinTouched) setJoinTouched(false);
                                }}
                                onBlur={() => setJoinTouched(true)}
                                placeholder="Enter meeting code"
                                className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400"
                            />
                            {joinError ? (
                                <p className="mt-1.5 text-xs text-red-600">{joinError}</p>
                            ) : null}
                        </div>

                        <button
                            type="button"
                            onClick={handleJoinMeeting}
                            disabled={!normalizedCode}
                            className="mt-5 w-full rounded-lg bg-blue-600 text-white font-semibold py-3 hover:bg-blue-700 transition-all duration-200 hover:scale-[1.01] hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none"
                        >
                            Join Meeting
                        </button>
                    </article>
                </section>

               
            </div>
        </div>
    );
};

export default WorkspaceCalls;
