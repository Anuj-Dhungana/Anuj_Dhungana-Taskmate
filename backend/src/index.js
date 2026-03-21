import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { createServer } from 'http'; 
import { Server } from 'socket.io';  
import connectDB from './config/db.js';

// Middleware
import { logger, errorLogger } from './middleware/logger.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import { apiLimiter } from './middleware/rateLimiter.js';

// Routes
import authRoutes from './routes/authRoutes.js';
import workspaceRoutes from './routes/workspaceRoutes.js';
import projectRoutes from './routes/projectRoutes.js';
import boardRoutes from './routes/boardRoutes.js';
import chatRoutes from './routes/chatRoutes.js'; 
import notificationRoutes from './routes/notificationRoutes.js';
import channelRoutes from './routes/channelRoutes.js';
import inviteRoutes from './routes/inviteRoutes.js';
import callRoutes from './routes/callRoutes.js';
import meetingRoutes from './routes/meetingRoutes.js';
import Message from './models/Message.js';

dotenv.config();
connectDB();

const app = express();

// Middleware
app.use(logger); // Request logging
app.use(express.json());
app.use(cookieParser());

// Trust the reverse proxy (like Render/Railway) for secure cookies
app.set("trust proxy", 1);

const allowedOrigins = [
    "http://localhost:5173",
    process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
    origin: allowedOrigins, 
    credentials: true 
}));

// Apply rate limiting to all API routes (skip in development to avoid 429s during dev/HMR)
if (process.env.NODE_ENV === 'production') {
    app.use('/api', apiLimiter);
}

// --- SOCKET.IO SETUP ---
const httpServer = createServer(app); // Wrap Express
const io = new Server(httpServer, {
    cors: {
        origin: allowedOrigins,
        methods: ["GET", "POST"],
        credentials: true
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

    // Join Workspace Room
    socket.on("join_workspace", (workspaceRoom) => {
        if (!workspaceRoom) return;
        socket.join(workspaceRoom);
        console.log(`User joined workspace: ${workspaceRoom}`);
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
                content: data.content || '',
                attachments: data.attachments || [],
                poll: data.poll || null
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
app.use('/api/channels', channelRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/invites', inviteRoutes);
app.use('/api/calls', callRoutes);
app.use('/api/meetings', meetingRoutes);
app.set('io', io); 

// Error handling middleware (must be after all routes)
app.use(errorLogger); // Log errors
app.use(notFound); // 404 handler
app.use(errorHandler); // Global error handler

app.get('/', (req, res) => {
    res.json({ message: "TaskMate Backend is running!" });
});

const PORT = process.env.PORT || 5000;

// IMPORTANT: Listen with httpServer, NOT app
httpServer.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
