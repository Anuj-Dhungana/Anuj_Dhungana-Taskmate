import { asyncHandler } from '../middleware/errorHandler.js';
import { generateProjectWithTasks, generateTasks, breakDownTask } from '../services/aiService.js';

// POST /api/ai/generate
export const generateAiContent = asyncHandler(async (req, res, next) => {
    const { prompt, actionType, taskTitle, taskDescription } = req.body;

    if (!prompt && actionType !== 'breakdown_task') {
        const error = new Error("Prompt is required");
        error.statusCode = 400;
        return next(error);
    }

    let result;

    switch (actionType) {
        case 'generate_tasks':
            result = await generateTasks(prompt);
            break;
        case 'breakdown_task':
            if (!taskTitle) {
                const error = new Error("Task title is required for breakdown");
                error.statusCode = 400;
                return next(error);
            }
            result = await breakDownTask({ taskTitle, taskDescription });
            break;
        case 'generate_project':
        default:
            result = await generateProjectWithTasks(prompt);
            break;
    }

    res.status(200).json(result);
});
