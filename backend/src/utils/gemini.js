import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.GEMINI_API_KEY) {
    console.warn("WARNING: GEMINI_API_KEY is not defined in the environment variables.");
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// We use gemini-3.5-flash as it's the standard for general text/json tasks now, 
// and it's fast/cheap.
const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });

export default model;
