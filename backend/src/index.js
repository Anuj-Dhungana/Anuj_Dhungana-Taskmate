import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { createServer } from 'http'; 
import { Server } from 'socket.io';  
import connectDB from './config/db.js';
import { getRedis } from './config/redis.js';

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
import Workspace from './models/Workspace.js';
import Channel from './models/Channel.js';
import jwt from 'jsonwebtoken';

dotenv.config();
connectDB();

const app = express();

// Middleware
app.use(logger); // Request logging
app.use(express.json());
app.use(cookieParser());

// Trust the reverse proxy (like Render/Railway) for secure cookies
app.set("trust proxy", 1);

const normalizeOrigin = (value) =>
    String(value || '')
        .trim()
        .replace(/\/+$/, '');

const expandOriginVariants = (origin) => {
    const normalized = normalizeOrigin(origin);
    if (!normalized) return [];

    try {
        const parsed = new URL(normalized);
        const variants = [normalized];

        if (parsed.hostname.startsWith('www.')) {
            const withoutWww = new URL(parsed.toString());
            withoutWww.hostname = parsed.hostname.replace(/^www\./, '');
            variants.push(normalizeOrigin(withoutWww.toString()));
        } else {
            const withWww = new URL(parsed.toString());
            withWww.hostname = `www.${parsed.hostname}`;
            variants.push(normalizeOrigin(withWww.toString()));
        }

        return variants;
    } catch {
        return [normalized];
    }
};

const envOrigins = [
    process.env.FRONTEND_URL,
    ...(process.env.FRONTEND_URLS || '')
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean),
];

const allowedOrigins = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    ...envOrigins.flatMap(expandOriginVariants),
]
    .map(normalizeOrigin)
    .filter(Boolean)
    .filter((origin, index, arr) => arr.indexOf(origin) === index);

const isAllowedOrigin = (origin) => {
    const normalized = normalizeOrigin(origin);
    return allowedOrigins.includes(normalized);
};

const corsOriginHandler = (origin, callback) => {
    // Allow non-browser requests (no Origin header).
    if (!origin) return callback(null, true);

    if (isAllowedOrigin(origin)) {
        return callback(null, true);
    }

    return callback(new Error(`CORS blocked for origin: ${origin}`));
};

app.use(cors({
    origin: corsOriginHandler,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

console.log('CORS allowed origins:', allowedOrigins);

// Apply rate limiting to all API routes (skip in development to avoid 429s during dev/HMR)
if (process.env.NODE_ENV === 'production') {
    app.use('/api', apiLimiter);
}

// --- SOCKET.IO SETUP ---
const httpServer = createServer(app); // Wrap Express
const io = new Server(httpServer, {
    cors: {
        origin: corsOriginHandler,
        methods: ["GET", "POST"],
        credentials: true
    }
});

// Socket.IO Authentication Middleware
io.use((socket, next) => {
    try {
        const cookies = socket.handshake.headers.cookie;
        if (!cookies) {
            return next(new Error("Authentication error"));
        }

        const tokenStr = cookies.split(';').find(c => c.trim().startsWith('jwt='));
        if (!tokenStr) {
            return next(new Error("Authentication error"));
        }

        const token = tokenStr.split('=')[1].trim();
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        socket.user = { userId: decoded.userId };
        next();
    } catch (err) {
        next(new Error("Authentication error"));
    }
});

// Socket Logic
io.on("connection", (socket) => {
    console.log("User Connected:", socket.id, "User ID:", socket.user?.userId);

    // Join a Channel Room
    socket.on("join_channel", async (channelId) => {
        try {
            const channel = await Channel.findById(channelId);
            if (!channel) return;
            
            const workspace = await Workspace.findById(channel.workspace);
            if (!workspace) return;
            
            const isWorkspaceMember = workspace.members.some(
                (m) => m.user.toString() === socket.user.userId.toString()
            );
            
            if (!isWorkspaceMember) {
                console.log(`User ${socket.user.userId} denied access to channel ${channelId} (not in workspace)`);
                return;
            }
            
            if (channel.members && channel.members.length > 0) {
                const isChannelMember = channel.members.some(
                    (id) => id.toString() === socket.user.userId.toString()
                );
                if (!isChannelMember) {
                    console.log(`User ${socket.user.userId} denied access to private channel/DM ${channelId}`);
                    return;
                }
            }

            socket.join(channelId);
            console.log(`User joined channel: ${channelId}`);
        } catch (error) {
            console.error("join_channel error:", error);
        }
    });

    // Join Workspace Room
    socket.on("join_workspace", async (workspaceRoom) => {
        if (!workspaceRoom) return;
        
        try {
            const workspaceId = workspaceRoom.replace('workspace_', '');
            const workspace = await Workspace.findById(workspaceId);
            if (!workspace) return;

            const isWorkspaceMember = workspace.members.some(
                (m) => m.user.toString() === socket.user.userId.toString()
            );

            if (!isWorkspaceMember) {
                console.log(`User ${socket.user.userId} denied access to workspace ${workspaceId}`);
                return;
            }

            socket.join(workspaceRoom);
            console.log(`User joined workspace: ${workspaceRoom}`);
        } catch (error) {
            console.error("join_workspace error:", error);
        }
    });

    // Handle New Message
    socket.on("send_message", async (data) => {
        try {
            const { channelId, workspaceId, content, attachments, poll, replyTo } = data;
            const senderId = socket.user?.userId;

            if (!senderId) {
                console.log("send_message error: Unauthenticated");
                socket.emit("message_error", { reason: "Unauthenticated request" });
                return;
            }

            if (!channelId || !workspaceId) {
                console.log("send_message error: Missing channelId or workspaceId");
                socket.emit("message_error", { reason: "Missing channelId or workspaceId" });
                return;
            }

            // Validate channel and membership
            const channel = await Channel.findById(channelId);
            if (!channel) {
                console.log("send_message error: Channel not found");
                socket.emit("message_error", { reason: "Channel not found" });
                return;
            }

            // If it's a private channel/DM, check channel members
            if (channel.members && channel.members.length > 0) {
                const isChannelMember = channel.members.some(
                    (member) => {
                        // Handle both raw ObjectId and { user: ObjectId } structure gracefully
                        const memberId = member.user ? member.user.toString() : member.toString();
                        return memberId === senderId.toString();
                    }
                );
                if (!isChannelMember) {
                    console.log(`User ${senderId} denied sending message to private channel/DM ${channelId}`);
                    socket.emit("message_error", { reason: "You are not a member of this private channel or DM" });
                    return;
                }
            } else {
                // If it's a public channel, check workspace members
                const workspace = await Workspace.findById(workspaceId);
                if (!workspace) {
                    console.log("send_message error: Workspace not found");
                    socket.emit("message_error", { reason: "Workspace not found" });
                    return;
                }
                const isWorkspaceMember = workspace.members.some(
                    (m) => m.user.toString() === senderId.toString()
                );
                if (!isWorkspaceMember) {
                    console.log(`User ${senderId} denied sending message to workspace ${workspaceId}`);
                    socket.emit("message_error", { reason: "You are not a member of this workspace" });
                    return;
                }
            }

            // 1. Save to DB securely
            const newMessage = await Message.create({
                workspaceId,
                channelId,
                sender: senderId,
                content: content || '',
                attachments: attachments || [],
                poll: poll || null,
                replyTo: replyTo || null
            });
            
            // 2. Populate fields for broadcast (prevent client forgery of sender details)
            const populatedMessage = await Message.findById(newMessage._id)
                .populate('sender', 'fullname avatar email')
                .populate({
                    path: 'replyTo',
                    populate: { path: 'sender', select: 'fullname avatar' }
                });

            // 3. Broadcast to everyone in that channel
            io.to(channelId).emit("receive_message", populatedMessage);

        } catch (err) {
            console.error("Socket Error during send_message:", err);
            socket.emit("message_error", { reason: "Internal server error while sending message" });
        }
    });

    // Handle Typing
    socket.on("typing", (data) => {
        // Broadcast user_typing to specific channel
        socket.to(data.channelId).emit("user_typing", data);
    });

    socket.on("stop_typing", (data) => {
        socket.to(data.channelId).emit("user_stop_typing", data);
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

app.get('/', (req, res) => {
    res.json({ message: "TaskMate Backend is running!" });
});

// Error handling middleware (must be after all routes)
app.use(errorLogger); // Log errors
app.use(notFound); // 404 handler
app.use(errorHandler); // Global error handler

const PORT = process.env.PORT || 5000;

// IMPORTANT: Listen with httpServer, NOT app
httpServer.listen(PORT, async () => {
    console.log(`Server running on http://localhost:${PORT}`);
    try {
        await getRedis().ping();
        console.log('Redis connected');
    } catch (err) {
        console.error('Redis unavailable:', err?.message || err);
    }
});
