import { body, param } from 'express-validator';

// Get messages validation
export const getMessagesValidation = [
    param('channelId')
        .notEmpty().withMessage('Channel ID is required')
        .isMongoId().withMessage('Invalid channel ID'),
];

// Send message validation
export const sendMessageValidation = [
    body('channelId')
        .notEmpty().withMessage('Channel ID is required')
        .isMongoId().withMessage('Invalid channel ID'),
    
    body('workspaceId')
        .optional()
        .isMongoId().withMessage('Invalid workspace ID'),
    
    body('content')
        .optional()
        .isString().withMessage('Content must be a string')
        .isLength({ max: 5000 }).withMessage('Message is too long (max 5000 chars)'),

    body()
        .custom((value, { req }) => {
            const { content, attachments, poll } = req.body;
            const hasContent = typeof content === 'string' && content.trim().length > 0;
            const hasAttachments = Array.isArray(attachments) && attachments.length > 0;
            const hasPoll = poll && typeof poll === 'object' && Object.keys(poll).length > 0;

            if (!hasContent && !hasAttachments && !hasPoll) {
                throw new Error('Message must have content, attachments, or a poll');
            }
            return true;
        }),
];

// Delete message validation
export const deleteMessageValidation = [
    param('id')
        .notEmpty().withMessage('Message ID is required')
        .isMongoId().withMessage('Invalid message ID'),
];

// Vote poll validation
export const votePollValidation = [
    param('id')
        .notEmpty().withMessage('Message ID is required')
        .isMongoId().withMessage('Invalid message ID'),
    
    body('optionIndex')
        .notEmpty().withMessage('Option index is required')
        .isInt({ min: 0 }).withMessage('Option index must be a non-negative integer'),
];

// Toggle reaction validation
export const toggleReactionValidation = [
    param('id')
        .notEmpty().withMessage('Message ID is required')
        .isMongoId().withMessage('Invalid message ID'),
    
    body('emoji')
        .notEmpty().withMessage('Emoji is required')
        .isString().withMessage('Emoji must be a string')
        .isLength({ max: 10 }).withMessage('Emoji cannot exceed 10 characters'),
];
