import { io } from 'socket.io-client';

const rawBase = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const socketBase = rawBase.replace(/\/api\/?$/, '');

const socket = io(socketBase, {
    autoConnect: true,
    withCredentials: true,
});

export default socket;
