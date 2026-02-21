import { useState, useEffect, useRef, useMemo } from 'react';
import axios from 'axios';
import useAuthStore from '../../store/useAuthStore';
import { Send, Hash, Trash2, Paperclip, Smile, Reply, MoreHorizontal } from 'lucide-react';
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
    const typingTimeoutRef = useRef(null);
    const messagesEndRef = useRef(null);

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
        if (!newMessage.trim() || !channel) return;

        const messageData = {
            channelId: channel._id,
            workspaceId: workspaceId,
            senderId: userInfo._id,
            content: newMessage,
            senderDetails: {
                _id: userInfo._id,
                fullname: userInfo.fullname,
                avatar: userInfo.avatar,
            },
        };

        socket.emit('send_message', messageData);
        setNewMessage('');
        setIsTyping(false);
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }
    };

    const handleDeleteMessage = async (messageId) => {
        try {
            await axios.delete(`/api/messages/${messageId}`);
            setMessages((prev) => prev.filter((m) => m._id !== messageId));
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

            <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5 bg-white">
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
                            const isMe = msg.sender?._id === userInfo?._id;
                            const prev = messagesWithGrouping[index - 1];
                            const isGroupStart = !prev || prev.sender?._id !== msg.sender?._id;
                            const canDelete = isMe || (canModerate && !isDM);

                            return (
                                <div
                                    key={msg._id}
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
                                            <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold mr-3 text-blue-600">
                                                {msg.sender?.fullname?.substring(0, 1) || 'U'}
                                            </div>
                                        )
                                    )}

                                    <div className={`max-w-[70%] group relative ${isMe ? 'items-end' : ''}`}>
                                        {isGroupStart && !isMe && (
                                            <p className="text-[11px] text-gray-500 font-semibold mb-1">
                                                {msg.sender?.fullname}
                                            </p>
                                        )}

                                        <div
                                            className={`px-3 py-2 rounded-2xl shadow-sm text-sm leading-relaxed ${
                                                isMe
                                                    ? 'bg-indigo-600 text-white rounded-br-md'
                                                    : 'bg-gray-100 text-gray-800 rounded-bl-md'
                                            }`}
                                        >
                                            {renderMessageContent(msg.content)}
                                        </div>

                                        <div className={`flex items-center justify-between mt-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                                            <p className={`text-[10px] ${isMe ? 'text-indigo-200' : 'text-gray-400'}`}>
                                                {new Date(msg.createdAt).toLocaleTimeString([], {
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                            </p>
                                            {canDelete && (
                                                <button
                                                    onClick={() => handleDeleteMessage(msg._id)}
                                                    className={`ml-2 text-[10px] flex items-center gap-1 ${
                                                        isMe
                                                            ? 'text-indigo-200 hover:text-white'
                                                            : 'text-gray-400 hover:text-red-500'
                                                    }`}
                                                    title="Delete message"
                                                >
                                                    <Trash2 size={12} />
                                                </button>
                                            )}
                                        </div>

                                        <div
                                            className={`absolute -top-3 ${
                                                isMe ? 'right-0' : 'left-0'
                                            } opacity-0 group-hover:opacity-100 transition`}
                                        >
                                            <div className="flex items-center gap-1 bg-white border border-gray-200 shadow-sm rounded-full px-2 py-1">
                                                <button
                                                    className="text-gray-400 hover:text-indigo-600"
                                                    title="Reply"
                                                >
                                                    <Reply size={12} />
                                                </button>
                                                <button
                                                    className="text-gray-400 hover:text-indigo-600"
                                                    title="React"
                                                >
                                                    <Smile size={12} />
                                                </button>
                                                <button
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

            <form onSubmit={handleSendMessage} className="px-6 pb-5">
                <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
                    <button
                        type="button"
                        className="text-gray-400 hover:text-indigo-600"
                        title="Attach file"
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
                        type="button"
                        className="text-gray-400 hover:text-indigo-600"
                        title="Emoji"
                    >
                        <Smile size={16} />
                    </button>
                    <button
                        type="submit"
                        disabled={!newMessage.trim()}
                        className={`w-9 h-9 rounded-full flex items-center justify-center transition ${
                            newMessage.trim()
                                ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        }`}
                    >
                        <Send size={16} />
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ChatArea;

