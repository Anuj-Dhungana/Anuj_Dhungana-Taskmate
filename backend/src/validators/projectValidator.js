import { body, param, query } from 'express-validator';

// Create project validation
const createProjectValidation = [
    body('name')
        .trim()
        .notEmpty().withMessage('Project name is required')
        .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
    
    body('description')
        .optional()
        .trim()
        .isLength({ max: 1000 }).withMessage('Description must not exceed 1000 characters'),
    
    body('workspaceId')
        .notEmpty().withMessage('Workspace ID is required')
        .isMongoId().withMessage('Invalid workspace ID'),
    
    body('startDate')
        .optional()
        .isISO8601().withMessage('Invalid start date format'),
    
    body('endDate')
        .optional()
        .isISO8601().withMessage('Invalid end date format'),
];

// Update project validation
const updateProjectValidation = [
    param('id')
        .notEmpty().withMessage('Project ID is required')
        .isMongoId().withMessage('Invalid project ID'),
    
    body('name')
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
    
    body('description')
        .optional()
        .trim()
        .isLength({ max: 1000 }).withMessage('Description must not exceed 1000 characters'),
    
    body('startDate')
        .optional()
        .isISO8601().withMessage('Invalid start date format'),
    
    body('endDate')
        .optional()
        .isISO8601().withMessage('Invalid end date format'),
];

// Get projects validation
const getProjectsValidation = [
    query('workspaceId')
        .notEmpty().withMessage('Workspace ID is required')
        .isMongoId().withMessage('Invalid workspace ID'),
];

export {
    createProjectValidation,
    updateProjectValidation,
    getProjectsValidation,
};
