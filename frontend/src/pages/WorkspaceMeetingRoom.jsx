import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Copy, Mic, MicOff, Video, VideoOff, ScreenShare, PhoneOff } from 'lucide-react';
import { toast } from 'react-hot-toast';

const sampleParticipants = [
    { id: 1, name: 'Anuj', micOn: true, color: 'bg-blue-100 text-blue-700' },
    { id: 2, name: 'Priya', micOn: false, color: 'bg-purple-100 text-purple-700' },
    { id: 3, name: 'Rahul', micOn: true, color: 'bg-emerald-100 text-emerald-700' },
    { id: 4, name: 'Sara', micOn: true, color: 'bg-amber-100 text-amber-700' },
];

const WorkspaceMeetingRoom = () => {
    const { meetingId = '' } = useParams();
    const [micOn, setMicOn] = useState(true);
    const [cameraOn, setCameraOn] = useState(true);
    const [sharing, setSharing] = useState(false);

    const meetingCode = useMemo(() => String(meetingId || '').toUpperCase(), [meetingId]);
    const participants = sampleParticipants;

    const copyMeetingCode = async () => {
        try {
            await navigator.clipboard.writeText(meetingCode);
            toast.success('Meeting code copied');
        } catch {
            toast.error('Failed to copy meeting code');
        }
    };

    return (
        <div className="px-4 md:px-8 py-6 md:py-8 min-h-screen bg-gray-50/30">
            <div className="mx-auto max-w-275 space-y-5">
                <header className="rounded-2xl border border-gray-200 bg-white shadow-sm px-4 py-4 md:px-5 md:py-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-center gap-3">
                        <span className="text-xs md:text-sm font-semibold text-gray-700">
                            Meeting Code: <span className="text-gray-900">{meetingCode || 'TM-XXXX-XXX'}</span>
                        </span>
                        <button
                            type="button"
                            onClick={copyMeetingCode}
                            className="inline-flex items-center gap-1 rounded-md border border-gray-200 px-2.5 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition"
                        >
                            <Copy className="w-3.5 h-3.5" />
                            Copy
                        </button>
                    </div>

                    <div className="flex items-center gap-4 text-xs md:text-sm text-gray-600">
                        <span>Participants: {participants.length}</span>
                        <span>Duration: 12:05</span>
                    </div>
                </header>

                <main className="rounded-2xl border border-gray-200 bg-white shadow-sm p-3 md:p-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                        {participants.map((person) => (
                            <article
                                key={person.id}
                                className="relative rounded-xl overflow-hidden bg-gray-900 min-h-45 md:min-h-55"
                            >
                                <div className={`absolute inset-0 flex items-center justify-center ${person.color}`}>
                                    <span className="text-4xl md:text-5xl font-bold">{person.name.charAt(0)}</span>
                                </div>

                                <div className="absolute left-3 right-3 bottom-3 flex items-center justify-between">
                                    <span className="rounded-md bg-black/60 text-white text-xs font-semibold px-2 py-1">
                                        {person.name}
                                    </span>
                                    <span className="rounded-full bg-black/60 p-1.5 text-white">
                                        {person.micOn ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5 text-red-300" />}
                                    </span>
                                </div>
                            </article>
                        ))}
                    </div>
                </main>

                <footer className="sticky bottom-4 flex justify-center">
                    <div className="rounded-full border border-gray-200 bg-white shadow-lg px-3 py-2 flex items-center gap-2 md:gap-3">
                        <button
                            type="button"
                            onClick={() => setMicOn((value) => !value)}
                            className={`h-11 w-11 rounded-full inline-flex items-center justify-center transition ${
                                micOn ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' : 'bg-red-100 text-red-600 hover:bg-red-200'
                            }`}
                            title="Toggle microphone"
                        >
                            {micOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                        </button>

                        <button
                            type="button"
                            onClick={() => setCameraOn((value) => !value)}
                            className={`h-11 w-11 rounded-full inline-flex items-center justify-center transition ${
                                cameraOn ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' : 'bg-red-100 text-red-600 hover:bg-red-200'
                            }`}
                            title="Toggle camera"
                        >
                            {cameraOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                        </button>

                        <button
                            type="button"
                            onClick={() => setSharing((value) => !value)}
                            className={`h-11 w-11 rounded-full inline-flex items-center justify-center transition ${
                                sharing ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                            title="Share screen"
                        >
                            <ScreenShare className="w-5 h-5" />
                        </button>

                        <button
                            type="button"
                            className="h-11 px-5 rounded-full inline-flex items-center justify-center gap-2 bg-red-600 text-white font-semibold hover:bg-red-700 transition"
                            title="End call"
                        >
                            <PhoneOff className="w-5 h-5" />
                            End Call
                        </button>
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default WorkspaceMeetingRoom;
