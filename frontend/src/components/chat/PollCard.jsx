import { useMemo } from 'react';
import axios from 'axios';
import { CheckCircle2, Circle } from 'lucide-react';
import { getInitials } from '../../utils/helpers';
import useRightPanelStore from '../../store/useRightPanelStore';

const PollCard = ({ messageId, poll, currentUserId, isMe }) => {
    
    const { openPanel } = useRightPanelStore();

    // Calculate total votes
    const totalVotes = useMemo(() => {
        return poll.options.reduce((sum, opt) => sum + (opt.votes?.length || 0), 0);
    }, [poll]);

    const handleVote = async (optionIndex) => {
        try {
            await axios.post(`/api/messages/${messageId}/vote`, { optionIndex });
            // Socket handles the state update
        } catch (error) {
            console.error("Failed to cast vote", error);
        }
    };

    // Dynamic styling so it blends transparently into the WhatsApp-style bubble (isMe vs not isMe)
    const textColor = isMe ? 'text-white' : 'text-gray-900';
    const subtextColor = isMe ? 'text-indigo-200' : 'text-gray-500';
    const activeFillColor = isMe ? 'text-emerald-400 fill-emerald-400/20' : 'text-emerald-500 fill-emerald-500/20';
    const barEmptyColor = isMe ? 'bg-indigo-900/40' : 'bg-gray-300/60';
    const barFillColor = isMe ? 'bg-emerald-400' : 'bg-emerald-500';
    const borderDivider = isMe ? 'border-indigo-400 border-opacity-30' : 'border-gray-200';

    return (
        <div className="w-full max-w-[340px] sm:max-w-[380px] -mx-1 -mt-1 min-w-[260px]">
            {/* Seamless WhatsApp style, no inner rigid borders */}
            <div className="p-2 pb-1">
                <h4 className={`text-[16px] font-bold leading-tight drop-shadow-sm break-words ${textColor}`}>{poll.question}</h4>
                <div className={`text-[12px] font-medium mt-1 mb-3 flex items-center gap-1.5 opacity-90 ${subtextColor}`}>
                    <CheckCircle2 size={13} className="opacity-80" />
                    {poll.multipleAnswers ? 'Select one or more' : 'Select one'}
                </div>
            </div>
            
            <div className="space-y-4 px-2 pb-4">
                {poll.options.map((option, index) => {
                    const votes = option.votes?.length || 0;
                    const percentage = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
                    const hasVoted = option.votes?.some(v => (v._id || v).toString() === currentUserId.toString());
                    
                    return (
                        <div 
                            key={index} 
                            onClick={() => handleVote(index)}
                            className="relative group cursor-pointer flex flex-col gap-[3px]"
                        >
                            <div className="flex items-center justify-between z-10 w-full pl-0.5 pr-1">
                                <div className="flex items-center gap-3.5 max-w-[80%]">
                                    <div className="shrink-0 flex items-center justify-center">
                                        {hasVoted ? (
                                            <CheckCircle2 size={24} className={`${activeFillColor} drop-shadow-sm transition-transform scale-110`} />
                                        ) : (
                                            <Circle size={24} className={`opacity-40 ${textColor} hover:opacity-100 transition-all group-hover:scale-105`} />
                                        )}
                                    </div>
                                    <span className={`text-[15px] font-medium truncate ${textColor}`}>
                                        {option.text}
                                    </span>
                                </div>
                                {votes > 0 && (
                                    <div className="flex items-center shrink-0 ml-2">
                                        <div className="flex -space-x-1.5 mr-1.5">
                                            {option.votes.slice(0, 3).map((voter) => {
                                                const voterId = voter._id || voter;
                                                const isPop = !!voter.fullname;
                                                const ringColor = isMe ? 'ring-[#4F46E5]' : 'ring-white'; // Approximate indigo-600 or white
                                                return isPop && voter.avatar ? (
                                                    <img key={voterId} src={voter.avatar} className={`w-[18px] h-[18px] rounded-full ring-[1px] ${ringColor} object-cover`} alt="" />
                                                ) : (
                                                    <div key={voterId} className={`w-[18px] h-[18px] rounded-full ring-[1px] ${ringColor} flex items-center justify-center text-[7px] font-bold text-white bg-slate-500 overflow-hidden`}>
                                                        {getInitials(isPop ? voter.fullname : 'U')}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        <span className={`text-[13px] font-black ${textColor}`}>{votes}</span>
                                    </div>
                                )}
                            </div>
                            
                            {/* WhatsApp Style Progress Bar Underneath */}
                            <div className="ml-[42px] mr-1 relative h-[6px] rounded-full overflow-hidden">
                                <div className={`absolute inset-0 ${barEmptyColor}`}></div>
                                <div 
                                    className={`absolute left-0 top-0 bottom-0 ${barFillColor} rounded-full transition-all duration-700 ease-in-out`}
                                    style={{ width: `${percentage}%` }}
                                ></div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className={`mt-0 border-t ${borderDivider}`}>
                <button 
                    onClick={() => openPanel('pollVotes', { poll })}
                    className={`w-full py-3 text-[14px] font-bold hover:bg-black/5 active:bg-black/10 transition-colors ${isMe ? 'text-emerald-300' : 'text-emerald-600'}`}
                >
                    View votes
                </button>
            </div>
        </div>
    );
};

export default PollCard;
