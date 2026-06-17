import { useState, useEffect, useRef, useMemo } from 'react';
import api from '../../api';
import useAuthStore from '../../store/useAuthStore';
import { Send, Hash, Trash2, Paperclip, Reply, Smile, MoreHorizontal, X, FileText, Image, File, Music, ChartBar } from 'lucide-react';
import socket from '../../lib/socket';
import CreatePollModal from './CreatePollModal';
import PollCard from './PollCard';
import MediaGallery from './MediaGallery';

const TASK_REGEX = /(Task\s*#\d+)/gi;

const EMOJI_LIST = ['👍', '❤️', '😂', '😮', '😢', '👏'];

const renderMessageContent = (content) => {
    if (!content) return null;
    const parts = content.split(TASK_REGEX);
    return parts.map((part, index) => {
        if (part.match(/^Task\s*#\d+$/i)) {
            return (
                <span
                    key={`task-${index}`}
                    className="inline-flex items-center px-2 py-0.5 mx-1 rounded-full bg-indigo-50 text-indigo-700 text-[11px] font-semibold border border-indigo-200"
                >
                    {part}
                </span>
            );
        }
        return <span key={`text-${index}`}>{part}</span>;
    });
};

const ChatArea = ({ channel, workspaceId, canModerate = false, showHeader = true, displayName, isDM = false }) => {
    const { userInfo } = useAuthStore();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [selectedMessageId, setSelectedMessageId] = useState(null);
    const [attachments, setAttachments] = useState([]);
    const [isUploading, setIsUploading] = useState(false);
    const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
    const [isCreatePollOpen, setIsCreatePollOpen] = useState(false);
    const [replyingToMessage, setReplyingToMessage] = useState(null);
    const [reactionPopupId, setReactionPopupId] = useState(null);
    const [typingUsers, setTypingUsers] = useState({});
    
    const messagesEndRef = useRef(null);
    const typingTimeoutRef = useRef(null);
    const attachmentMenuRef = useRef(null);
    
    // Hidden specific file inputs
    const mediaInputRef = useRef(null);
    const docInputRef = useRef(null);
    const audioInputRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (attachmentMenuRef.current && !attachmentMenuRef.current.contains(event.target)) {
                setShowAttachmentMenu(false);
            }
            // Auto close reaction popup if clicking outside
            if (!event.target.closest('.reaction-popup-container') && !event.target.closest('.reaction-btn')) {
                setReactionPopupId(null);
            }
        };
        if (showAttachmentMenu) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showAttachmentMenu]);

    const scrollToBottom = () => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    };

    // 1. Join Room & Load History when Channel Changes
    useEffect(() => {
        if (!channel || !workspaceId) return;

        // Fetch History
        const fetchMessages = async () => {
            try {
                const res = await api.get(`/api/messages/${channel._id}`);
                setMessages(res.data);
                scrollToBottom();
            } catch (err) {
                console.error(err);
            }
        };

        fetchMessages();

        // Join Socket Room
        socket.emit('join_workspace', `workspace_${workspaceId}`);
        socket.emit('join_channel', channel._id);

        // Listen for incoming messages
        const handleReceiveMessage = (msg) => {
            if (msg.channelId === channel._id) {
                setMessages((prev) => [...prev, msg]);
                scrollToBottom();
            }
        };

        const handleMessageUpdated = (updatedMsg) => {
            if (updatedMsg.channelId === channel._id) {
                setMessages((prev) => prev.map(m => m._id === updatedMsg._id ? updatedMsg : m));
            }
        };

        const handleUserTyping = (data) => {
            if (data.channelId === channel._id && data.user !== userInfo.fullname) {
                setTypingUsers(prev => ({ ...prev, [data.user]: true }));
            }
        };

        const handleUserStopTyping = (data) => {
            if (data.channelId === channel._id) {
                setTypingUsers(prev => {
                    const newmap = { ...prev };
                    delete newmap[data.user];
                    return newmap;
                });
            }
        };

        socket.on('receive_message', handleReceiveMessage);
        socket.on('poll_updated', handleMessageUpdated);
        socket.on('message_updated', handleMessageUpdated);
        socket.on('user_typing', handleUserTyping);
        socket.on('user_stop_typing', handleUserStopTyping);

        return () => {
            socket.off('receive_message', handleReceiveMessage);
            socket.off('poll_updated', handleMessageUpdated);
            socket.off('message_updated', handleMessageUpdated);
            socket.off('user_typing', handleUserTyping);
            socket.off('user_stop_typing', handleUserStopTyping);
        };
    }, [channel, workspaceId, userInfo.fullname]);

    const handleSendPoll = (pollData) => {
        if (!channel) return;
        const messageData = {
            channelId: channel._id,
            workspaceId: workspaceId,
            content: '',
            attachments: [],
            poll: pollData,
        };
        socket.emit('send_message', messageData);
        scrollToBottom();
    };

    const handleSendMessage = async (e) => {
        e?.preventDefault();
        if ((!newMessage.trim() && attachments.length === 0) || !channel || isUploading) return;

        const messageData = {
            channelId: channel._id,
            workspaceId: workspaceId,
            content: newMessage,
            attachments: attachments,
            replyTo: replyingToMessage?._id || null,
        };

        socket.emit('send_message', messageData);
        setNewMessage('');
        setAttachments([]);
        setReplyingToMessage(null);
        socket.emit('stop_typing', { channelId: channel?._id, user: userInfo?.fullname });
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };

    const handleFileChange = async (e) => {
        const files = Array.from(e.target.files);
        if (!files.length) return;

        const formData = new FormData();
        files.forEach(file => formData.append('attachments', file));

        setIsUploading(true);
        try {
            const res = await api.post('/api/messages/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setAttachments(prev => [...prev, ...res.data.files]);
        } catch (err) {
            console.error("Upload failed", err);
        } finally {
            setIsUploading(false);
            e.target.value = null; // reset input
        }
    };

    const handleToggleReaction = async (messageId, emoji) => {
        setReactionPopupId(null);
        try {
            await api.post(`/api/messages/${messageId}/react`, { emoji });
        } catch (error) {
            console.error("Failed to react:", error);
        }
    };

    const handleDeleteMessage = async (messageId) => {
        try {
            await api.delete(`/api/messages/${messageId}`);
            setMessages((prev) => prev.filter((m) => m._id !== messageId));
            setSelectedMessageId((currentId) => (currentId === messageId ? null : currentId));
        } catch (err) {
            console.error('Failed to delete message', err);
        }
    };

    const handleInputChange = (e) => {
        setNewMessage(e.target.value);
        if (channel && userInfo) {
            socket.emit('typing', { channelId: channel._id, user: userInfo.fullname });
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = setTimeout(() => {
                socket.emit('stop_typing', { channelId: channel._id, user: userInfo.fullname });
            }, 1500);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage(e);
        }
    };

    const messagesWithGrouping = useMemo(() => messages || [], [messages]);
    const conversationName = displayName || channel?.name || '';

    return (
        <div className="flex flex-col h-full min-h-0 bg-white">
            {showHeader && channel && (
                <div className="p-4 border-b flex items-center shadow-sm">
                    <Hash className="text-gray-500 mr-2" size={20} />
                    <h2 className="font-bold text-gray-800">{conversationName}</h2>
                </div>
            )}

            <div
                className="flex-1 min-h-0 overflow-y-auto px-6 py-5 bg-white"
                onClick={() => setSelectedMessageId(null)}
            >
                {messagesWithGrouping.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-gray-400">
                        <div className="text-center">
                            <div className="text-base font-semibold text-gray-600">No messages yet</div>
                            <div className="text-sm mt-1">Start the conversation.</div>
                        </div>
                    </div>
                ) : (
                    <div>
                        {messagesWithGrouping.map((msg, index) => {
                            // Use String() comparison so ObjectId from Mongoose === string from localStorage
                            const senderId = String(msg.sender?._id || msg.sender || '');
                            const isMe = !!senderId && senderId === String(userInfo?._id || '');
                            const prev = messagesWithGrouping[index - 1];
                            const prevSenderId = String(prev?.sender?._id || prev?.sender || '');
                            const isGroupStart = !prev || prevSenderId !== senderId;
                            const canDelete = isMe || (canModerate && !isDM);
                            const isSelected = selectedMessageId === msg._id;
                            
                            // Group attachments by type
                            const mediaAttachments = msg.attachments ? msg.attachments.filter(a => ['image', 'video'].includes(a.resource_type)) : [];
                            const docAttachments = msg.attachments ? msg.attachments.filter(a => !['image', 'video'].includes(a.resource_type)) : [];

                            return (
                                <div
                                    key={msg._id}
                                    onClick={(event) => {
                                        event.stopPropagation();
                                        setSelectedMessageId((currentId) => (
                                            currentId === msg._id ? null : msg._id
                                        ));
                                    }}
                                    className={`flex ${isMe ? 'justify-end' : 'justify-start'} ${
                                        isGroupStart ? 'mt-4' : 'mt-1'
                                    }`}
                                >
                                    {!isMe && isGroupStart && (
                                        msg.sender?.avatar ? (
                                            <img
                                                src={msg.sender.avatar}
                                                alt={msg.sender?.fullname || 'User'}
                                                className="w-9 h-9 rounded-full object-cover mr-3 border border-gray-200"
                                                onError={(event) => {
                                                    event.currentTarget.style.display = 'none';
                                                }}
                                            />
                                        ) : (
                                            <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold mr-3 text-blue-600 shrink-0">
                                                {msg.sender?.fullname?.substring(0, 1) || 'U'}
                                            </div>
                                        )
                                    )}

                                    {/* Indent grouped non-me messages to align with the avatar-offset above */}
                                    {!isMe && !isGroupStart && <div className="w-9 mr-3 shrink-0" />}

                                    <div className={`max-w-[70%] relative ${isMe ? 'items-end' : ''}`}>
                                        {isGroupStart && !isMe && (
                                            <p className="text-[11px] text-gray-500 font-semibold mb-1">
                                                {msg.sender?.fullname}
                                            </p>
                                        )}

                                        <div
                                            className={`px-3 py-2 rounded-2xl shadow-sm text-sm leading-relaxed cursor-pointer ${
                                                isMe
                                                    ? 'bg-indigo-600 text-white rounded-br-md'
                                                    : 'bg-gray-100 text-gray-800 rounded-bl-md'
                                            }`}
                                        >
                                            <div className={`flex items-end gap-2 ${isMe ? 'justify-end' : 'justify-start'}`}>
                                                <div className="min-w-0 wrap-break-word">
                                                    {msg.replyTo && (
                                                        <div 
                                                            className={`mb-2 p-2 rounded-lg border-l-4 text-xs opacity-90 cursor-default ${isMe ? 'bg-[#5b52db] border-[#8179f3]' : 'bg-gray-200 border-indigo-500'}`}
                                                        >
                                                            <div className="flex items-center justify-between mb-1">
                                                                <span className={`font-bold ${isMe ? 'text-indigo-100' : 'text-indigo-700'}`}>
                                                                    {msg.replyTo.sender?.fullname || 'Unknown User'}
                                                                </span>
                                                            </div>
                                                            <div className={`truncate max-w-[200px] sm:max-w-[300px] ${isMe ? 'text-gray-100' : 'text-gray-600'}`}>
                                                                {msg.replyTo.content || (msg.replyTo.attachments?.length > 0 ? 'Attachment' : msg.replyTo.poll ? `Poll: ${msg.replyTo.poll.question}` : 'Deleted message')}
                                                            </div>
                                                        </div>
                                                    )}
                                                    {msg.poll ? (
                                                        <PollCard 
                                                            messageId={msg._id} 
                                                            poll={msg.poll} 
                                                            currentUserId={userInfo._id} 
                                                            isMe={isMe}
                                                        />
                                                    ) : (
                                                        renderMessageContent(msg.content)
                                                    )}
                                                    
                                                    {mediaAttachments.length > 0 && (
                                                        <MediaGallery media={mediaAttachments} />
                                                    )}
                                                    
                                                    {docAttachments.length > 0 && (
                                                        <div className="flex flex-col gap-1.5 mt-2">
                                                            {docAttachments.map((att, i) => (
                                                                <a
                                                                    key={`doc-${i}`}
                                                                    href={att.url}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="block"
                                                                >
                                                                    {att.resource_type === 'audio' ? (
                                                                        <audio src={att.url} controls className="w-full max-w-[240px] outline-none rounded-lg mt-1" />
                                                                    ) : (
                                                                        <div className={`flex items-center gap-3 p-3 rounded-xl transition-colors min-w-[200px] w-full max-w-[280px] ${isMe ? 'bg-[#4b5563]/30 hover:bg-[#4b5563]/50' : 'bg-gray-200 hover:bg-gray-300'}`}>
                                                                            <div className={`w-11 h-11 rounded-lg flex items-center justify-center shrink-0 ${isMe ? 'bg-[#f43f5e] text-white shadow-sm' : 'bg-red-500 text-white shadow-sm'}`}>
                                                                                <FileText size={22} fill="currentColor" className="opacity-90" />
                                                                            </div>
                                                                            <div className="flex flex-col min-w-0 pr-2">
                                                                                <span className={`text-[15px] font-semibold truncate tracking-tight ${isMe ? 'text-white' : 'text-gray-900'}`}>{att.original_filename}</span>
                                                                                <span className={`text-[11px] font-bold mt-0.5 opacity-80 uppercase tracking-wider ${isMe ? 'text-gray-200' : 'text-gray-500'}`}>{att.resource_type === 'raw' ? 'DOCUMENT' : 'FILE'}</span>
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </a>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                                <span className={`shrink-0 text-[10px] leading-none ${
                                                    isMe ? 'text-indigo-200' : 'text-gray-400'
                                                }`}>
                                                    {new Date(msg.createdAt).toLocaleTimeString([], {
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                    })}
                                                </span>
                                            </div>
                                        </div>

                                        <div
                                            className={`absolute -top-3 ${
                                                isMe ? 'right-0' : 'left-0'
                                            } ${isSelected ? 'opacity-100' : 'opacity-0 pointer-events-none'} transition`}
                                        >
                                            <div className="flex items-center gap-1 bg-white border border-gray-200 shadow-sm rounded-full px-2 py-1">
                                                <button
                                                    type="button"
                                                    onClick={(event) => {
                                                        event.stopPropagation();
                                                        setReactionPopupId(reactionPopupId === msg._id ? null : msg._id);
                                                    }}
                                                    className="text-gray-400 hover:text-indigo-600 reaction-btn"
                                                    title="React"
                                                >
                                                    <Smile size={12} />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={(event) => {
                                                        event.stopPropagation();
                                                        setReplyingToMessage(msg);
                                                        setSelectedMessageId(null);
                                                    }}
                                                    className="text-gray-400 hover:text-indigo-600"
                                                    title="Reply"
                                                >
                                                    <Reply size={12} />
                                                </button>
                                                {canDelete && (
                                                    <button
                                                        type="button"
                                                        onClick={(event) => {
                                                            event.stopPropagation();
                                                            handleDeleteMessage(msg._id);
                                                        }}
                                                        className="text-gray-400 hover:text-red-500"
                                                        title="Delete message"
                                                    >
                                                        <Trash2 size={12} />
                                                    </button>
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={(event) => event.stopPropagation()}
                                                    className="text-gray-400 hover:text-indigo-600"
                                                    title="More"
                                                >
                                                    <MoreHorizontal size={12} />
                                                </button>
                                            </div>
                                            
                                            {/* Emoji Picker Popup */}
                                            {reactionPopupId === msg._id && (
                                                <div 
                                                    className={`absolute bottom-[110%] ${isMe ? 'right-0' : 'left-0'} bg-white border border-gray-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.15)] rounded-full px-2.5 py-2 flex gap-1.5 z-50 reaction-popup-container animate-in fade-in zoom-in-95 duration-150`}
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    {EMOJI_LIST.map((emoji) => (
                                                        <button
                                                            key={emoji}
                                                            onClick={() => handleToggleReaction(msg._id, emoji)}
                                                            className="hover:scale-125 hover:-translate-y-1 transition-transform origin-bottom text-[22px] leading-none"
                                                            type="button"
                                                        >
                                                            {emoji}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        
                                        {/* Reaction Pills Below Bubble */}
                                        {msg.reactions && msg.reactions.length > 0 && (
                                            <div className={`flex flex-wrap gap-1 mt-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                                                {msg.reactions.map((reaction, i) => {
                                                    const iReacted = reaction.users.some(uId => typeof uId === 'object' ? uId._id === userInfo._id : uId === userInfo._id);
                                                    return (
                                                        <button
                                                            key={`${reaction.emoji}-${i}`}
                                                            onClick={() => handleToggleReaction(msg._id, reaction.emoji)}
                                                            className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full border shadow-sm text-[11px] font-bold ${
                                                                iReacted 
                                                                    ? 'bg-indigo-50 border-indigo-200 text-indigo-700' 
                                                                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                                                            }`}
                                                        >
                                                            <span>{reaction.emoji}</span>
                                                            <span className={iReacted ? 'text-indigo-600' : 'text-gray-500'}>{reaction.users.length}</span>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </div>
                )}
            </div>

            <div className="px-6 pb-2 min-h-[24px]">
                {Object.keys(typingUsers).length > 0 && (
                    <span className="text-xs text-indigo-500 font-medium animate-pulse flex items-center gap-1">
                        <div className="flex space-x-1">
                            <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce"></div>
                            <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                        <span className="ml-1">
                            {Object.keys(typingUsers).join(', ')} {Object.keys(typingUsers).length > 1 ? 'are' : 'is'} typing...
                        </span>
                    </span>
                )}
            </div>

            <form onSubmit={handleSendMessage} className="px-6 pb-5 relative">
                
                {/* Replying To Banner */}
                {replyingToMessage && (
                    <div className="flex items-center justify-between mb-2 p-3 bg-indigo-50/50 rounded-xl border-l-4 border-indigo-500 shadow-sm">
                        <div className="flex flex-col min-w-0 mr-4">
                            <span className="text-[12px] font-bold text-indigo-700 leading-tight">
                                Replying to {replyingToMessage.sender?.fullname || 'User'}
                            </span>
                            <span className="text-[13px] text-gray-600 truncate mt-0.5">
                                {replyingToMessage.content || 
                                (replyingToMessage.attachments?.length > 0 ? 'Attachment' : 
                                replyingToMessage.poll ? `Poll: ${replyingToMessage.poll.question}` : '')}
                            </span>
                        </div>
                        <button
                            type="button"
                            onClick={() => setReplyingToMessage(null)}
                            className="p-1 rounded-full hover:bg-indigo-100 text-indigo-400 hover:text-indigo-700 transition"
                        >
                            <X size={16} />
                        </button>
                    </div>
                )}

                {/* Upload Queued Attachments Preview */}
                {attachments.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2 p-3 bg-gray-50 rounded-xl border border-gray-200 shadow-sm shadow-gray-100">
                        {attachments.map((att, i) => (
                            <div key={i} className="relative group w-16 h-16 rounded-lg overflow-hidden border border-gray-200 bg-white">
                                {att.resource_type === 'image' ? (
                                    <img src={att.url} alt="" className="w-full h-full object-cover" />
                                ) : att.resource_type === 'video' ? (
                                    <div className="w-full h-full bg-gray-800 flex items-center justify-center text-white text-[10px] font-bold">VIDEO</div>
                                ) : att.resource_type === 'audio' ? (
                                    <div className="w-full h-full bg-orange-100 flex items-center justify-center text-orange-600 text-[10px] font-bold">AUDIO</div>
                                ) : (
                                    <div className="w-full h-full bg-indigo-50 flex items-center justify-center text-[10px] text-indigo-600 px-1 text-center truncate" title={att.original_filename}>
                                        {att.original_filename.substring(0, 8)}...
                                    </div>
                                )}
                                <button
                                    type="button"
                                    onClick={() => setAttachments(prev => prev.filter((_, index) => index !== i))}
                                    className="absolute -top-1 -right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <X size={10} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
                
                {/* Hidden specific file inputs */}
                <input type="file" multiple ref={mediaInputRef} className="hidden" accept="image/*,video/*" onChange={handleFileChange} />
                <input type="file" multiple ref={docInputRef} className="hidden" accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.csv" onChange={handleFileChange} />
                <input type="file" multiple ref={audioInputRef} className="hidden" accept="audio/*" onChange={handleFileChange} />
                
                <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
                    <div className="relative flex items-center" ref={attachmentMenuRef}>
                        <button
                            type="button"
                            className={`text-gray-400 hover:text-indigo-600 transition-colors ${isUploading ? 'opacity-50 cursor-wait' : ''}`}
                            title="Attach file"
                            onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
                            disabled={isUploading}
                        >
                            <Paperclip size={16} />
                        </button>

                        {showAttachmentMenu && (
                            <div className="absolute bottom-full mb-3 left-0 bg-white border border-gray-100 rounded-2xl shadow-xl shadow-gray-200/50 py-2 w-48 z-50">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowAttachmentMenu(false);
                                        mediaInputRef.current?.click();
                                    }}
                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                                >
                                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                        <Image size={16} />
                                    </div>
                                    Photos & Videos
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowAttachmentMenu(false);
                                        docInputRef.current?.click();
                                    }}
                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                                >
                                    <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                                        <File size={16} />
                                    </div>
                                    Document
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowAttachmentMenu(false);
                                        audioInputRef.current?.click();
                                    }}
                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                                >
                                    <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                                        <Music size={16} />
                                    </div>
                                    Audio
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowAttachmentMenu(false);
                                        setIsCreatePollOpen(true);
                                    }}
                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                                >
                                    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                                        <ChartBar size={16} />
                                    </div>
                                    Poll
                                </button>
                            </div>
                        )}
                    </div>
                    <textarea
                        rows={1}
                        placeholder={
                            channel
                                ? isDM
                                    ? `Message ${conversationName}`
                                    : `Message #${conversationName}`
                                : 'Message'
                        }
                        className="flex-1 bg-transparent outline-none text-sm resize-none"
                        value={newMessage}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                    />
                    <button
                        type="submit"
                        disabled={(!newMessage.trim() && attachments.length === 0) || isUploading}
                        className={`w-9 h-9 rounded-full flex items-center justify-center transition ${
                            (newMessage.trim() || attachments.length > 0) && !isUploading
                                ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm shadow-indigo-200'
                                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        }`}
                        title={isUploading ? "Uploading..." : "Send"}
                    >
                        {isUploading ? (
                            <div className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                        ) : (
                            <Send size={16} />
                        )}
                    </button>
                </div>
            </form>

            <CreatePollModal 
                isOpen={isCreatePollOpen} 
                onClose={() => setIsCreatePollOpen(false)} 
                onSubmit={handleSendPoll} 
            />
        </div>
    );
};

export default ChatArea;
