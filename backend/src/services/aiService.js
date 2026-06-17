import model from '../utils/gemini.js';

/**
 * Strips markdown formatting (like ```json ... ```) from a string.
 */
const stripMarkdown = (text) => {
    let cleanText = text.trim();
    if (cleanText.startsWith('```json')) {
        cleanText = cleanText.substring(7);
    } else if (cleanText.startsWith('```')) {
        cleanText = cleanText.substring(3);
    }
    if (cleanText.endsWith('```')) {
        cleanText = cleanText.substring(0, cleanText.length - 3);
    }
    return cleanText.trim();
};

export const generateProjectWithTasks = async (prompt) => {
    const systemPrompt = `You are an expert AI Project Manager. Your goal is to break down a project idea into actionable tasks.

CRITICAL INSTRUCTION:
Return ONLY valid JSON.
No markdown block formatting.
No explanations.
No code block ticks.

The JSON MUST match this exact schema:
{
  "projectName": "A concise, professional name for the project",
  "tasks": [
    {
      "title": "A short, actionable task title",
      "description": "A detailed description of what needs to be done"
    }
  ]
}

Generate between 5 to 10 high-quality tasks for the following idea:
"${prompt}"
`;

    try {
        const result = await model.generateContent(systemPrompt);
        const response = await result.response;
        const text = response.text();
        
        const cleanJsonText = stripMarkdown(text);
        
        try {
            const parsedData = JSON.parse(cleanJsonText);
            return parsedData;
        } catch (parseError) {
            console.error("AI Service: Failed to parse Gemini response as JSON", text);
            throw new Error("AI generated invalid data format");
        }
        
    } catch (error) {
        console.error("AI Service Error:", error);
        throw error;
    }
};

export const generateTasks = async (prompt) => {
    const systemPrompt = `You are an expert AI Project Manager. Your goal is to break down a specific sub-feature or idea into actionable tasks for an existing project.

CRITICAL INSTRUCTION:
Return ONLY valid JSON.
No markdown block formatting.
No explanations.
No code block ticks.

The JSON MUST match this exact schema:
{
  "tasks": [
    {
      "title": "A short, actionable task title",
      "description": "A detailed description of what needs to be done"
    }
  ]
}

Generate between 3 to 7 high-quality tasks for the following feature/idea:
"${prompt}"
`;

    try {
        const result = await model.generateContent(systemPrompt);
        const response = await result.response;
        const text = response.text();
        
        const cleanJsonText = stripMarkdown(text);
        
        try {
            const parsedData = JSON.parse(cleanJsonText);
            return parsedData;
        } catch (parseError) {
            console.error("AI Service: Failed to parse Gemini response as JSON", text);
            throw new Error("AI generated invalid data format");
        }
        
    } catch (error) {
        console.error("AI Service Error:", error);
        throw error;
    }
};

export const breakDownTask = async ({ taskTitle, taskDescription }) => {
    const descriptionContext = taskDescription
        ? `\nTask Description: "${taskDescription}"`
        : '';

    const systemPrompt = `You are an expert AI Project Manager. Your goal is to break down a specific task into smaller, actionable subtasks.

CRITICAL INSTRUCTION:
Return ONLY valid JSON.
No markdown block formatting.
No explanations.
No code block ticks.

The JSON MUST match this exact schema:
{
  "subtasks": [
    "Concise, actionable subtask title"
  ]
}

Generate between 4 to 8 clear, specific subtasks for the following task:
Task Title: "${taskTitle}"${descriptionContext}
`;

    try {
        const result = await model.generateContent(systemPrompt);
        const response = await result.response;
        const text = response.text();

        const cleanJsonText = stripMarkdown(text);

        try {
            const parsedData = JSON.parse(cleanJsonText);
            return parsedData;
        } catch (parseError) {
            console.error("AI Service: Failed to parse Gemini response as JSON", text);
            throw new Error("AI generated invalid data format");
        }
    } catch (error) {
        console.error("AI Service Error:", error);
        throw error;
    }
};

