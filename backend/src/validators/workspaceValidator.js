import { body, param } from 'express-validator';

// Create workspace validation
const createWorkspaceValidation = [
    body('name')
        .trim()
        .notEmpty().withMessage('Workspace name is required')
        .isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
    
    body('description')
        .optional()
        .trim()
        .isLength({ max: 500 }).withMessage('Description must not exceed 500 characters'),
    
    body('color')
        .optional()
        .trim()
        .isLength({ max: 50 }).withMessage('Color value too long'),
];

// Update workspace validation
const updateWorkspaceValidation = [
    param('id')
        .notEmpty().withMessage('Workspace ID is required')
        .isMongoId().withMessage('Invalid workspace ID'),
    
    body('name')
        .optional()
        .trim()
        .isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
    
    body('description')
        .optional()
        .trim()
        .isLength({ max: 500 }).withMessage('Description must not exceed 500 characters'),
    
    body('color')
        .optional()
        .trim()
        .isLength({ max: 50 }).withMessage('Color value too long'),
];

// Invite user validation
const inviteUserValidation = [
    param('id')
        .notEmpty().withMessage('Workspace ID is required')
        .isMongoId().withMessage('Invalid workspace ID'),
    
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Invalid email format')
        .normalizeEmail(),
];

// Update member role validation
const updateMemberRoleValidation = [
    param('id')
        .notEmpty().withMessage('Workspace ID is required')
        .isMongoId().withMessage('Invalid workspace ID'),
    
    body('userId')
        .notEmpty().withMessage('User ID is required')
        .isMongoId().withMessage('Invalid user ID'),
    
    body('role')
        .notEmpty().withMessage('Role is required')
        .isIn(['admin', 'member', 'viewer']).withMessage('Invalid role'),
];

// Remove member validation
const removeMemberValidation = [
    param('id')
        .notEmpty().withMessage('Workspace ID is required')
        .isMongoId().withMessage('Invalid workspace ID'),
    
    param('userId')
        .notEmpty().withMessage('User ID is required')
        .isMongoId().withMessage('Invalid user ID'),
];

export {
    createWorkspaceValidation,
    updateWorkspaceValidation,
    inviteUserValidation,
    updateMemberRoleValidation,
    removeMemberValidation,
};
