import { asyncHandler } from '../middleware/errorHandler.js';
import { generateProjectWithTasks, generateTasks } from '../services/aiService.js';

// POST /api/ai/generate
export const generateAiContent = asyncHandler(async (req, res, next) => {
    const { prompt, actionType } = req.body;

    if (!prompt) {
        const error = new Error("Prompt is required");
        error.statusCode = 400;
        return next(error);
    }

    let result;

    switch (actionType) {
        case 'generate_tasks':
            result = await generateTasks(prompt);
            break;
        case 'generate_project':
        default:
            result = await generateProjectWithTasks(prompt);
            break;
    }

    res.status(200).json(result);
});
