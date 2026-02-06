import { validationResult } from 'express-validator';

// Middleware to check validation results
const validate = (req, res, next) => {
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
        const extractedErrors = errors.array().map(err => ({
            field: err.path || err.param,
            message: err.msg,
        }));
        
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: extractedErrors,
        });
    }
    
    next();
};

export default validate;
