// utils/validators.js - Request validators
const { check, validationResult } = require('express-validator');
const ErrorResponse = require('./errorResponse');

/**
 * Validation result middleware
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new ErrorResponse(errors.array()[0].msg, 400));
  }
  next();
};

/**
 * Registration validation rules
 */
exports.registerRules = [
  check('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  
  check('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email'),
  
  check('password')
    .trim()
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  
  check('role')
    .optional()
    .isIn(['admin', 'business', 'individual'])
    .withMessage('Role must be admin, business, or individual')
];

/**
 * Login validation rules
 */
exports.loginRules = [
  check('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email'),
  
  check('password')
    .trim()
    .notEmpty()
    .withMessage('Password is required')
];

/**
 * Support request validation rules
 */
exports.supportRequestRules = [
  check('device_type')
    .trim()
    .notEmpty()
    .withMessage('Device type is required'),
  
  check('issue_desc')
    .trim()
    .notEmpty()
    .withMessage('Issue description is required'),
  
  check('location')
    .trim()
    .notEmpty()
    .withMessage('Location is required'),
  
  check('scheduled_time')
    .notEmpty()
    .withMessage('Scheduled time is required')
    .custom((value) => {
      const scheduledTime = new Date(value);
      const now = new Date();
      if (scheduledTime <= now) {
        throw new Error('Scheduled time must be in the future');
      }
      return true;
    })
];

/**
 * Spare part validation rules
 */
exports.sparePartRules = [
  check('name')
    .trim()
    .notEmpty()
    .withMessage('Part name is required'),
  
  check('quantity')
    .isInt({ min: 0 })
    .withMessage('Quantity must be a non-negative integer'),
  
  check('price')
    .isFloat({ min: 0 })
    .withMessage('Price must be a non-negative number')
];

/**
 * Knowledge base article validation rules
 */
exports.knowledgeBaseRules = [
  check('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required'),
  
  check('description')
    .trim()
    .notEmpty()
    .withMessage('Description is required'),
  
  check('solution')
    .trim()
    .notEmpty()
    .withMessage('Solution is required')
];