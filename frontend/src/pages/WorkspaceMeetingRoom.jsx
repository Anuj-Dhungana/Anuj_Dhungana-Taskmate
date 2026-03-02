import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { ZegoUIKitPrebuilt } from '@zegocloud/zego-uikit-prebuilt';
import api from '../api';
import useAuthStore from '../store/useAuthStore';

const WorkspaceMeetingRoom = () => {
    const { meetingId = '' } = useParams();
    const navigate = useNavigate();
    const containerRef = useRef(null);
    const zegoRef = useRef(null);
    const userInfo = useAuthStore((state) => state.userInfo);
    const [isJoining, setIsJoining] = useState(true);
    const [joinError, setJoinError] = useState('');
    const [attempt, setAttempt] = useState(0);

    useEffect(() => {
        if (!meetingId || !userInfo?._id || !containerRef.current) return undefined;

        let cancelled = false;

        const initRoom = async () => {
            try {
                setIsJoining(true);
                setJoinError('');
                const response = await api.post('/api/calls/token', {
                    roomID: String(meetingId),
                });

                if (cancelled) return;

                const { appID, token, roomID, userID, userName } = response.data || {};
                const kitToken = ZegoUIKitPrebuilt.generateKitTokenForProduction(
                    Number(appID),
                    String(token || ''),
                    String(roomID || meetingId),
                    String(userID || userInfo._id),
                    String(userName || userInfo.fullname || 'User')
                );

                const zp = ZegoUIKitPrebuilt.create(kitToken);
                zegoRef.current = zp;

                zp.joinRoom({
                    container: containerRef.current,
                    sharedLinks: [
                        {
                            name: 'Join link',
                            url: `${window.location.origin}/calls/${roomID || meetingId}`,
                        },
                    ],
                    scenario: {
                        mode: ZegoUIKitPrebuilt.GroupCall,
                    },
                    showPreJoinView: true,
                    turnOnMicrophoneWhenJoining: true,
                    turnOnCameraWhenJoining: true,
                    showScreenSharingButton: true,
                    maxUsers: 20,
                    onLeaveRoom: () => navigate('/calls'),
                });

                setIsJoining(false);
            } catch (error) {
                if (cancelled) return;
                console.error('Failed to join Zego room', error);
                setJoinError(error?.response?.data?.message || 'Failed to join the meeting');
                setIsJoining(false);
                toast.error(error?.response?.data?.message || 'Failed to join the meeting');
            }
        };

        initRoom();

        return () => {
            cancelled = true;
            zegoRef.current?.destroy();
            zegoRef.current = null;
        };
    }, [meetingId, navigate, userInfo?._id, userInfo?.fullname, attempt]);

    return (
        <div className="min-h-screen bg-gray-950">
            <div className="flex items-center justify-between px-4 md:px-6 py-3 border-b border-white/10 bg-gray-950/95 backdrop-blur">
                <div className="min-w-0">
                    <div className="text-xs uppercase tracking-[0.18em] text-gray-400">TaskMate Call</div>
                    <div className="text-sm md:text-base font-semibold text-white truncate">
                        Meeting ID: {String(meetingId || '').toUpperCase()}
                    </div>
                </div>

                <button
                    type="button"
                    onClick={() => navigate('/calls')}
                    className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-gray-100 hover:bg-white/10 transition"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Calls
                </button>
            </div>

            {isJoining && (
                <div className="absolute inset-x-0 top-16 z-10 flex justify-center pointer-events-none">
                    <div className="rounded-full border border-blue-400/20 bg-blue-500/10 px-4 py-2 text-sm text-blue-100 shadow-lg">
                        Joining meeting...
                    </div>
                </div>
            )}

            {joinError ? (
                <div className="min-h-[calc(100vh-65px)] flex items-center justify-center px-4">
                    <div className="w-full max-w-md rounded-2xl border border-red-400/20 bg-white p-6 text-center shadow-2xl">
                        <div className="text-lg font-semibold text-gray-900">Unable to join meeting</div>
                        <p className="mt-2 text-sm text-gray-600">{joinError}</p>
                        <div className="mt-5 flex items-center justify-center gap-3">
                            <button
                                type="button"
                                onClick={() => setAttempt((value) => value + 1)}
                                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition"
                            >
                                <RefreshCw className="w-4 h-4" />
                                Retry
                            </button>
                            <button
                                type="button"
                                onClick={() => navigate('/calls')}
                                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
                            >
                                Leave
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <div ref={containerRef} className="h-[calc(100vh-65px)] w-full" />
            )}
        </div>
    );
};

export default WorkspaceMeetingRoom;
