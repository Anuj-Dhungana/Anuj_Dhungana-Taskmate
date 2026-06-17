import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
    console.error("NO API KEY FOUND!");
    process.exit(1);
}

// Fetch the URL manually to list models
const fetchModels = async () => {
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const data = await response.json();
        console.log("AVAILABLE MODELS:");
        data.models?.forEach(m => {
            console.log(`- ${m.name}`);
        });
    } catch (e) {
        console.error("Failed to fetch models", e);
    }
};

fetchModels();
