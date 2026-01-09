import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { createServer } from 'http'; // <--- Import HTTP
import { Server } from 'socket.io';  // <--- Import Socket.io
import connectDB from './config/db.js';

// Routes
import authRoutes from './routes/authRoutes.js';
import workspaceRoutes from './routes/workspaceRoutes.js';
import projectRoutes from './routes/projectRoutes.js';
import boardRoutes from './routes/boardRoutes.js';
import chatRoutes from './routes/chatRoutes.js'; 
import notificationRoutes from './routes/notificationRoutes.js';

// Models for Socket Saving
import Message from './models/Message.js';

dotenv.config();
connectDB();

const app = express();

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin: ["http://localhost:5173"], 
    credentials: true 
}));

// --- SOCKET.IO SETUP ---
const httpServer = createServer(app); // Wrap Express
const io = new Server(httpServer, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"]
    }
});

// Socket Logic
io.on("connection", (socket) => {
    console.log("User Connected:", socket.id);

    // Join a Channel Room
    socket.on("join_channel", (channelId) => {
        socket.join(channelId);
        console.log(`User joined channel: ${channelId}`);
    });

    // Handle New Message
    socket.on("send_message", async (data) => {
        // data = { channelId, workspaceId, senderId, content, senderDetails }
        
        // 1. Save to DB
        try {
            const newMessage = await Message.create({
                workspaceId: data.workspaceId,
                channelId: data.channelId,
                sender: data.senderId,
                content: data.content
            });
            
            // 2. Add sender info to send back to clients
            // (In a real app, we populate. Here we trust frontend or populate manually)
            const messageToSend = {
                ...newMessage._doc,
                sender: data.senderDetails 
            };

            // 3. Broadcast to everyone in that channel
            io.to(data.channelId).emit("receive_message", messageToSend);

        } catch (err) {
            console.error("Socket Error:", err);
        }
    });

    socket.on("disconnect", () => {
        console.log("User Disconnected", socket.id);
    });
});


app.use('/api/auth', authRoutes);
app.use('/api/workspaces', workspaceRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/board', boardRoutes);
app.use('/api/messages', chatRoutes); 
app.use('/api/notifications', notificationRoutes);
app.set('io', io); 

app.get('/', (req, res) => {
    res.json({ message: "TaskMate Backend is running!" });
});

const PORT = process.env.PORT || 5000;

// IMPORTANT: Listen with httpServer, NOT app
httpServer.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});