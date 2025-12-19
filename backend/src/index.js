import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js'; 
import workspaceRoutes from './routes/workspaceRoutes.js';

dotenv.config();
connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin: ["http://localhost:5173"], 
    credentials: true 
}));


app.use('/api/auth', authRoutes);
app.use('/api/workspaces', workspaceRoutes);

app.get('/', (req, res) => {
    res.json({ message: "TaskMate Backend is running!" });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});