import { useEffect } from 'react';
import { X, CheckCircle2 } from 'lucide-react';
import { getAvatarColor, getInitials } from '../../utils/helpers';

const PollVotesPanel = ({ poll, onClose }) => {
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    if (!poll) return null;

    return (
        <div className="w-full h-full bg-white flex flex-col">
            {/* Header - WhatsApp style */}
            <div className="flex items-center h-[60px] px-5 gap-6 border-b border-gray-100 shrink-0">
                <button 
                    onClick={onClose}
                    className="text-gray-500 hover:text-gray-800 transition-colors p-1 -ml-1 rounded-full hover:bg-gray-100"
                >
                    <X size={22} strokeWidth={2.5} />
                </button>
                <h2 className="text-[16px] font-bold text-gray-900 leading-none">Poll details</h2>
            </div>
            
            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto w-full py-2 bg-white">
                {poll.options.map((option, idx) => {
                    const votes = option.votes || [];
                    
                    return (
                        <div key={idx} className="mt-4 px-6 mb-6">
                            {/* Option Header */}
                            <div className="flex items-start justify-between mb-4">
                                <span className="font-semibold text-[15px] text-gray-900 wrap-break-word pr-4 leading-snug">
                                    {option.text}
                                </span>
                                {votes.length > 0 ? (
                                    <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-full shrink-0 flex items-center shadow-sm">
                                        {votes.length} {votes.length === 1 ? 'vote' : 'votes'}
                                    </span>
                                ) : (
                                    <span className="text-[11px] font-bold text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full shrink-0 shadow-sm">
                                        0 votes
                                    </span>
                                )}
                            </div>
                            
                            {/* Voters List */}
                            {votes.length > 0 && (
                                <div className="space-y-4">
                                    {votes.map((voter) => {
                                        const voterId = voter._id || voter;
                                        const isPopulated = !!voter.fullname;
                                        
                                        return (
                                            <div key={voterId} className="flex items-center gap-3.5">
                                                {isPopulated && voter.avatar ? (
                                                    <img src={voter.avatar} alt={voter.fullname} className="w-[38px] h-[38px] rounded-full object-cover shrink-0" />
                                                ) : (
                                                    <div 
                                                        className="w-[38px] h-[38px] rounded-full flex items-center justify-center text-white text-[14px] font-bold shrink-0"
                                                        style={{ backgroundColor: getAvatarColor(voterId) }}
                                                    >
                                                        {getInitials(isPopulated ? voter.fullname : '?')}
                                                    </div>
                                                )}
                                                <div className="flex flex-col min-w-0">
                                                    <span className="text-[15px] font-medium text-gray-900 truncate tracking-tight">
                                                        {isPopulated ? voter.fullname : 'Unknown User'}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default PollVotesPanel;
