import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import useAuthStore from '../../store/useAuthStore';
import { Send, Hash, Trash2 } from 'lucide-react';

// Connect to backend
const socket = io('http://localhost:5000');

const ChatArea = ({ channel, workspaceId, canModerate = false, showHeader = true }) => {
    const { userInfo } = useAuthStore();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef(null);

    // 1. Join Room & Load History when Channel Changes
    useEffect(() => {
        if (!channel || !workspaceId) return;

        // Fetch History
        const fetchMessages = async () => {
            try {
                const res = await axios.get(`/api/messages/${channel._id}`);
                setMessages(res.data);
                scrollToBottom();
            } catch (err) { console.error(err); }
        };

        fetchMessages();

        // Join Socket Room
        socket.emit("join_workspace", `workspace_${workspaceId}`);
        socket.emit("join_channel", channel._id);

        // Listen for incoming messages
        const handleReceiveMessage = (msg) => {
            // Only add if it belongs to this channel
            if (msg.channelId === channel._id) {
                setMessages((prev) => [...prev, msg]);
                scrollToBottom();
            }
        };

        socket.on("receive_message", handleReceiveMessage);

        return () => {
            socket.off("receive_message", handleReceiveMessage);
        };
    }, [channel, workspaceId]);

    // Auto-scroll to bottom
    const scrollToBottom = () => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        const messageData = {
            channelId: channel._id,
            workspaceId: workspaceId,
            senderId: userInfo._id,
            content: newMessage,
            senderDetails: {
                _id: userInfo._id,
                fullname: userInfo.fullname,
                avatar: userInfo.avatar
            }
        };

        // Emit to Socket Server
        socket.emit("send_message", messageData);
        
        // Optimistic Update (Optional, but socket usually is fast enough)
        setNewMessage('');
    };

    const handleDeleteMessage = async (messageId) => {
        try {
            await axios.delete(`/api/messages/${messageId}`);
            setMessages((prev) => prev.filter((m) => m._id !== messageId));
        } catch (err) {
            console.error('Failed to delete message', err);
        }
    };

    return (
        <div className="flex flex-col h-full bg-white">
            {/* Header */}
            {showHeader && (
                <div className="p-4 border-b flex items-center shadow-sm">
                    <Hash className="text-gray-500 mr-2" size={20}/>
                    <h2 className="font-bold text-gray-800">{channel.name}</h2>
                </div>
            )}

            {/* Messages List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                {messages.map((msg) => {
                    const isMe = msg.sender._id === userInfo._id;
                    const canDelete = canModerate || isMe;
                    return (
                        <div key={msg._id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                            {/* Avatar */}
                            {!isMe && (
                                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold mr-2 text-blue-600">
                                    {msg.sender.fullname.substring(0,1)}
                                </div>
                            )}
                            
                            <div className={`max-w-[70%] p-3 rounded-lg shadow-sm ${
                                isMe ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white text-gray-800 border rounded-bl-none'
                            }`}>
                                {!isMe && <p className="text-[10px] text-gray-500 font-bold mb-1">{msg.sender.fullname}</p>}
                                <p className="text-sm">{msg.content}</p>
                                <div className="flex items-center justify-between mt-1">
                                    <p className={`text-[10px] ${isMe ? 'text-blue-200' : 'text-gray-400'}`}>
                                        {new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                    </p>
                                    {canDelete && (
                                        <button
                                            onClick={() => handleDeleteMessage(msg._id)}
                                            className={`ml-2 text-[10px] flex items-center gap-1 ${isMe ? 'text-blue-200 hover:text-white' : 'text-gray-400 hover:text-red-500'}`}
                                            title="Delete message"
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={handleSendMessage} className="p-4 bg-white border-t">
                <div className="flex items-center bg-gray-100 rounded-lg px-2">
                    <input 
                        type="text" 
                        placeholder={`Message #${channel.name}`}
                        className="flex-1 bg-transparent p-3 outline-none text-sm"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                    />
                    <button className="text-blue-600 hover:bg-blue-200 p-2 rounded-full transition">
                        <Send size={18} />
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ChatArea;
