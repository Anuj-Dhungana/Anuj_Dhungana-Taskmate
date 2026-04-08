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
                poll: data.poll || null,
                replyTo: data.replyTo || null
            });
            
            let populatedReplyTo = null;
            if (data.replyTo) {
                const replyMsg = await Message.findById(data.replyTo).populate('sender', 'fullname avatar');
                populatedReplyTo = replyMsg;
            }
            
            // 2. Add sender info to send back to clients
            // (In a real app, we populate. Here we trust frontend or populate manually)
            const messageToSend = {
                ...newMessage._doc,
                sender: data.senderDetails,
                replyTo: populatedReplyTo
            };

            // 3. Broadcast to everyone in that channel
            io.to(data.channelId).emit("receive_message", messageToSend);

        } catch (err) {
            console.error("Socket Error:", err);
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
