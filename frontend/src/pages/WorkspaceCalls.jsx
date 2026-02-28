import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Video, Phone, Calendar, Clock3, Users } from 'lucide-react';
import useWorkspaceStore from '../store/useWorkspaceStore';

const WorkspaceCalls = () => {
    const navigate = useNavigate();
    const { currentWorkspaceId } = useWorkspaceStore();
    const [quickCallValue, setQuickCallValue] = useState('');

    const teamMembers = [
        { initials: 'AD', name: 'Anuj', status: 'online' },
        { initials: 'KK', name: 'Kamal', status: 'online' },
        { initials: 'SS', name: 'Sita', status: 'busy' },
        { initials: 'RT', name: 'Rajesh', status: 'offline' },
        { initials: 'PA', name: 'Priya', status: 'online' },
        { initials: 'BS', name: 'Bibek', status: 'online' },
    ];

    const recentCalls = [
        { name: 'Sita Sharma', time: '2 hours ago', duration: '45 min', status: 'Completed', type: 'video' },
        { name: 'Rajesh Thapa', time: 'Yesterday', duration: '12 min', status: 'Completed', type: 'audio' },
        { name: 'Team Standup', time: '2 days ago', duration: '30 min', status: 'Missed', type: 'video' },
    ];

    const scheduledMeetings = [
        { title: 'Sprint Planning', schedule: 'Today, 2:00 PM', duration: '1 hour', participants: 8, code: 'TM-4829-ABX' },
        { title: 'Client Review', schedule: 'Tomorrow, 10:00 AM', duration: '45 min', participants: 5, code: 'TM-6701-KLT' },
        { title: 'Team Sync', schedule: 'Friday, 3:00 PM', duration: '30 min', participants: 12, code: 'TM-9088-QWP' },
    ];

    const statusDotClass = (status) => {
        if (status === 'online') return 'bg-emerald-500';
        if (status === 'busy') return 'bg-amber-500';
        return 'bg-gray-400';
    };

    if (!currentWorkspaceId) {
        return (
            <div className="px-8 py-10">
                <div className="mx-auto max-w-6xl text-center text-gray-500">Select a workspace to manage calls.</div>
            </div>
        );
    }

    return (
        <div className="px-6 md:px-8 py-7">
            <div className="mx-auto max-w-6xl space-y-5">
                <header>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Calls & Meetings</h1>
                        <p className="text-sm text-gray-500 mt-1">Connect with your team instantly</p>
                    </div>
                </header>

                <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                    <h2 className="text-xl font-semibold text-gray-900">Quick Call</h2>

                    <div className="mt-4 flex flex-col lg:flex-row gap-2.5">
                        <input
                            type="text"
                            value={quickCallValue}
                            onChange={(event) => setQuickCallValue(event.target.value)}
                            placeholder="Enter name or room ID"
                            className="flex-1 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-800 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-200"
                        />
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => navigate('/calls/TM-4829-ABX')}
                                className="inline-flex items-center gap-2 rounded-lg bg-indigo-500 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-600 transition"
                            >
                                <Video className="h-4 w-4" />
                                Video Call
                            </button>
                            <button
                                type="button"
                                onClick={() => navigate('/calls/TM-4829-ABX')}
                                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
                            >
                                <Phone className="h-4 w-4" />
                                Audio Call
                            </button>
                        </div>
                    </div>

                    <div className="mt-5">
                        <p className="text-sm font-semibold text-gray-700">Team Members</p>
                        <div className="mt-4 grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-4">
                            {teamMembers.map((member) => (
                                <div key={member.name} className="flex flex-col items-center gap-1.5">
                                    <div className="relative">
                                        <div className="h-11 w-11 rounded-full bg-gray-100 text-gray-700 flex items-center justify-center text-sm font-semibold">
                                            {member.initials}
                                        </div>
                                        <span className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border border-white ${statusDotClass(member.status)}`} />
                                    </div>
                                    <span className="text-xs font-medium text-gray-700">{member.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <article className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                        <h3 className="text-3xl font-semibold tracking-tight text-gray-900">Recent Calls</h3>

                        <div className="mt-5 space-y-4">
                            {recentCalls.map((call) => (
                                <div key={`${call.name}-${call.time}`} className="flex items-center justify-between">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className={`h-8 w-8 rounded-full flex items-center justify-center ${call.type === 'audio' ? 'bg-emerald-100 text-emerald-600' : 'bg-indigo-100 text-indigo-600'}`}>
                                            {call.type === 'audio' ? <Phone className="h-4 w-4" /> : <Video className="h-4 w-4" />}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-base font-semibold text-gray-800 truncate">{call.name}</p>
                                            <p className="text-sm text-gray-500">{call.time}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-base text-gray-700">{call.duration}</p>
                                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${call.status === 'Missed' ? 'bg-red-100 text-red-600' : 'bg-indigo-100 text-indigo-600'}`}>
                                            {call.status}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </article>

                    <article className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                        <h3 className="text-3xl font-semibold tracking-tight text-gray-900">Scheduled Meetings</h3>

                        <div className="mt-5 space-y-3.5">
                            {scheduledMeetings.map((meeting) => (
                                <div key={meeting.code} className="rounded-xl border border-gray-200 bg-gray-50/40 p-4">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <p className="text-lg font-semibold text-gray-900">{meeting.title}</p>
                                            <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-gray-500">
                                                <span className="inline-flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{meeting.schedule}</span>
                                                <span className="inline-flex items-center gap-1"><Clock3 className="h-3.5 w-3.5" />{meeting.duration}</span>
                                            </div>
                                        </div>
                                        <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-2 py-0.5 text-xs text-gray-600">
                                            <Users className="h-3.5 w-3.5" />
                                            {meeting.participants}
                                        </span>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => navigate(`/calls/${meeting.code}`)}
                                        className="mt-3 w-full rounded-lg bg-indigo-500 text-white py-2.5 text-sm font-semibold hover:bg-indigo-600 transition"
                                    >
                                        Join Meeting
                                    </button>
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
