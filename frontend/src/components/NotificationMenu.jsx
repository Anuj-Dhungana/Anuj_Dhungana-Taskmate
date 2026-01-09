import { useState, useEffect } from 'react';
import axios from 'axios';
import { Bell, Check } from 'lucide-react';
import io from 'socket.io-client';
import useAuthStore from '../store/useAuthStore';
import { toast } from 'react-hot-toast';

const socket = io('http://localhost:5000');

const NotificationMenu = () => {
    const { userInfo } = useAuthStore();
    const [notifications, setNotifications] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    // 1. Fetch Notifications on Load
    const fetchNotifications = async () => {
        try {
            const res = await axios.get('/api/notifications');
            setNotifications(res.data);
            setUnreadCount(res.data.filter(n => !n.isRead).length);
        } catch (err) { console.error(err); }
    };

    useEffect(() => {
        fetchNotifications();

        // 2. Listen for Real-time alerts
        socket.on("new_notification", (newNotif) => {
            // Check if this notification is for ME
            if (newNotif.recipient === userInfo._id) {
                setNotifications(prev => [newNotif, ...prev]);
                setUnreadCount(prev => prev + 1);
                toast(`New notification from ${newNotif.sender.fullname}`);
            }
        });

        return () => { socket.off("new_notification"); };
    }, [userInfo._id]);

    // 3. Mark as Read Handler
    const handleRead = async (notif) => {
        if (notif.isRead) return;
        try {
            await axios.put(`/api/notifications/${notif._id}/read`);
            setNotifications(notifications.map(n => 
                n._id === notif._id ? { ...n, isRead: true } : n
            ));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (err) { console.error(err); }
    };

    return (
        <div className="relative">
            {/* Bell Icon */}
            <button onClick={() => setIsOpen(!isOpen)} className="relative text-gray-500 hover:text-blue-600">
                <Bell size={24} />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full">
                        {unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white shadow-xl rounded-lg border border-gray-200 z-50 overflow-hidden">
                    <div className="p-3 border-b bg-gray-50 flex justify-between items-center">
                        <h3 className="font-bold text-sm text-gray-700">Notifications</h3>
                        <button onClick={fetchNotifications} className="text-xs text-blue-500 hover:underline">Refresh</button>
                    </div>

                    <div className="max-h-64 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <p className="p-4 text-center text-sm text-gray-400">No notifications</p>
                        ) : (
                            notifications.map(n => (
                                <div 
                                    key={n._id} 
                                    onClick={() => handleRead(n)}
                                    className={`p-3 border-b flex items-start gap-3 cursor-pointer hover:bg-gray-50 transition ${n.isRead ? 'opacity-60' : 'bg-blue-50'}`}
                                >
                                    <div className="w-2 h-2 mt-2 rounded-full flex-shrink-0 bg-blue-500" style={{ opacity: n.isRead ? 0 : 1 }}></div>
                                    <div>
                                        <p className="text-sm text-gray-800">
                                            <span className="font-bold">{n.sender?.fullname}</span> {n.message}
                                        </p>
                                        <p className="text-[10px] text-gray-400 mt-1">
                                            {new Date(n.createdAt).toLocaleTimeString()}
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
            
            {/* Overlay to close when clicking outside */}
            {isOpen && <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>}
        </div>
    );
};

export default NotificationMenu;