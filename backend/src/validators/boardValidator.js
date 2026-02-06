import { body, param, query } from 'express-validator';

// Create list validation
const createListValidation = [
    body('title')
        .trim()
        .notEmpty().withMessage('List title is required')
        .isLength({ min: 1, max: 100 }).withMessage('Title must be between 1 and 100 characters'),
    
    body('projectId')
        .notEmpty().withMessage('Project ID is required')
        .isMongoId().withMessage('Invalid project ID'),
];

// Create card validation
const createCardValidation = [
    body('title')
        .trim()
        .notEmpty().withMessage('Card title is required')
        .isLength({ min: 1, max: 200 }).withMessage('Title must be between 1 and 200 characters'),
    
    body('listId')
        .notEmpty().withMessage('List ID is required')
        .isMongoId().withMessage('Invalid list ID'),
    
    body('projectId')
        .notEmpty().withMessage('Project ID is required')
        .isMongoId().withMessage('Invalid project ID'),
    
    body('description')
        .optional()
        .trim()
        .isLength({ max: 2000 }).withMessage('Description must not exceed 2000 characters'),
    
    body('assignedTo')
        .optional()
        .isMongoId().withMessage('Invalid user ID'),
    
    body('dueDate')
        .optional()
        .isISO8601().withMessage('Invalid due date format'),
    
    body('priority')
        .optional()
        .isIn(['low', 'medium', 'high', 'urgent']).withMessage('Invalid priority value'),
];

// Update card validation
const updateCardValidation = [
    param('id')
        .notEmpty().withMessage('Card ID is required')
        .isMongoId().withMessage('Invalid card ID'),
    
    body('title')
        .optional()
        .trim()
        .isLength({ min: 1, max: 200 }).withMessage('Title must be between 1 and 200 characters'),
    
    body('description')
        .optional()
        .trim()
        .isLength({ max: 2000 }).withMessage('Description must not exceed 2000 characters'),
    
    body('assignedTo')
        .optional()
        .custom((value) => {
            if (value === null) return true; // Allow null to unassign
            if (typeof value === 'string' && value.match(/^[0-9a-fA-F]{24}$/)) return true;
            throw new Error('Invalid user ID');
        }),
    
    body('dueDate')
        .optional()
        .custom((value) => {
            if (value === null) return true; // Allow null
            if (new Date(value).toString() !== 'Invalid Date') return true;
            throw new Error('Invalid due date format');
        }),
    
    body('priority')
        .optional()
        .isIn(['low', 'medium', 'high', 'urgent']).withMessage('Invalid priority value'),
];

// Reorder cards validation
const reorderCardsValidation = [
    body('cardId')
        .notEmpty().withMessage('Card ID is required')
        .isMongoId().withMessage('Invalid card ID'),
    
    body('sourceListId')
        .notEmpty().withMessage('Source list ID is required')
        .isMongoId().withMessage('Invalid source list ID'),
    
    body('destinationListId')
        .notEmpty().withMessage('Destination list ID is required')
        .isMongoId().withMessage('Invalid destination list ID'),
    
    body('newIndex')
        .notEmpty().withMessage('New index is required')
        .isInt({ min: 0 }).withMessage('New index must be a non-negative integer'),
];

// Workspace stats validation
const workspaceStatsValidation = [
    query('workspaceId')
        .notEmpty().withMessage('Workspace ID is required')
        .isMongoId().withMessage('Invalid workspace ID'),
];

export {
    createListValidation,
    createCardValidation,
    updateCardValidation,
    reorderCardsValidation,
    workspaceStatsValidation,
};
