import { asyncHandler } from '../middleware/errorHandler.js';
import { generateProjectWithTasks } from '../services/aiService.js';

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
        case 'generate_project':
        default:
            result = await generateProjectWithTasks(prompt);
            break;
        // In Phase 2, we can add cases for 'break_down_task', 'generate_description', etc.
    }

    res.status(200).json(result);
});
