import { useState, useEffect, useRef, useMemo } from 'react';
import axios from 'axios';
import useAuthStore from '../../store/useAuthStore';
import { Send, Hash, Trash2, Paperclip, Reply, MoreHorizontal, X, FileText } from 'lucide-react';
import socket from '../../lib/socket';

const TASK_REGEX = /(Task\s*#\d+)/gi;

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
    const [isTyping, setIsTyping] = useState(false);
    const [selectedMessageId, setSelectedMessageId] = useState(null);
    const [attachments, setAttachments] = useState([]);
    const [isUploading, setIsUploading] = useState(false);
    const typingTimeoutRef = useRef(null);
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);

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
                const res = await axios.get(`/api/messages/${channel._id}`);
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

        socket.on('receive_message', handleReceiveMessage);

        return () => {
            socket.off('receive_message', handleReceiveMessage);
        };
    }, [channel, workspaceId]);

    const handleSendMessage = async (e) => {
        e?.preventDefault();
        if ((!newMessage.trim() && attachments.length === 0) || !channel || isUploading) return;

        const messageData = {
            channelId: channel._id,
            workspaceId: workspaceId,
            senderId: userInfo._id,
            content: newMessage,
            attachments: attachments,
            senderDetails: {
                _id: userInfo._id,
                fullname: userInfo.fullname,
                avatar: userInfo.avatar,
            },
        };

        socket.emit('send_message', messageData);
        setNewMessage('');
        setAttachments([]);
        setIsTyping(false);
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }
    };

    const handleFileChange = async (e) => {
        const files = Array.from(e.target.files);
        if (!files.length) return;

        const formData = new FormData();
        files.forEach(file => formData.append('attachments', file));

        setIsUploading(true);
        try {
            const res = await axios.post('/api/messages/upload', formData, {
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

    const handleDeleteMessage = async (messageId) => {
        try {
            await axios.delete(`/api/messages/${messageId}`);
            setMessages((prev) => prev.filter((m) => m._id !== messageId));
            setSelectedMessageId((currentId) => (currentId === messageId ? null : currentId));
        } catch (err) {
            console.error('Failed to delete message', err);
        }
    };

    const handleInputChange = (e) => {
        setNewMessage(e.target.value);
        setIsTyping(true);
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }
        typingTimeoutRef.current = setTimeout(() => {
            setIsTyping(false);
        }, 1200);
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
                                                <div className="min-w-0 break-words">
                                                    {renderMessageContent(msg.content)}
                                                    {msg.attachments && msg.attachments.length > 0 && (
                                                        <div className="flex flex-wrap gap-2 mt-2">
                                                            {msg.attachments.map((att, i) => (
                                                                <a key={i} href={att.url} target="_blank" rel="noreferrer" className="block max-w-[200px]">
                                                                    {att.resource_type === 'image' ? (
                                                                        <img src={att.url} alt="attachment" className="rounded-lg max-h-48 object-contain bg-gray-50/50" />
                                                                    ) : att.resource_type === 'video' ? (
                                                                        <video src={att.url} controls className="rounded-lg max-h-48 outline-none" />
                                                                    ) : (
                                                                        <div className="flex items-center gap-2 p-2 bg-gray-50/50 text-indigo-700 rounded-lg border border-indigo-100 hover:bg-white transition-colors">
                                                                            <FileText size={16} />
                                                                            <span className="text-xs truncate max-w-[140px]">{att.original_filename}</span>
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
                                                    onClick={(event) => event.stopPropagation()}
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
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </div>
                )}
            </div>

            <div className="px-6 pb-2 text-xs text-gray-400">
                {isTyping && newMessage.trim().length > 0 ? 'Typing…' : ''}
            </div>

            <form onSubmit={handleSendMessage} className="px-6 pb-5 relative">
                {/* Upload Queued Attachments Preview */}
                {attachments.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2 p-3 bg-gray-50 rounded-xl border border-gray-200 shadow-sm shadow-gray-100">
                        {attachments.map((att, i) => (
                            <div key={i} className="relative group w-16 h-16 rounded-lg overflow-hidden border border-gray-200 bg-white">
                                {att.resource_type === 'image' ? (
                                    <img src={att.url} alt="" className="w-full h-full object-cover" />
                                ) : att.resource_type === 'video' ? (
                                    <div className="w-full h-full bg-gray-800 flex items-center justify-center text-white text-[10px] font-bold">VIDEO</div>
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
                
                <input
                    type="file"
                    multiple
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleFileChange}
                />
                
                <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
                    <button
                        type="button"
                        className={`text-gray-400 hover:text-indigo-600 transition-colors ${isUploading ? 'opacity-50 cursor-wait' : ''}`}
                        title="Attach file"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                    >
                        <Paperclip size={16} />
                    </button>
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
        </div>
    );
};

export default ChatArea;
