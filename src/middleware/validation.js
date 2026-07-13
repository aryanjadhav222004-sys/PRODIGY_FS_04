const { body, query, param, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation Error',
      code: 'VALIDATION_ERROR',
      details: errors.array().map(e => ({
        field: e.path,
        message: e.msg,
        value: e.value,
      })),
    });
  }
  next();
};

const validateRegister = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be 3-30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 8, max: 128 })
    .withMessage('Password must be 8-128 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain uppercase, lowercase, and number'),
  body('displayName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Display name must be 1-50 characters'),
  handleValidationErrors,
];

const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  handleValidationErrors,
];

const validateCreateRoom = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Room name must be 1-100 characters'),
  body('type')
    .isIn(['private', 'group'])
    .withMessage('Type must be private or group'),
  body('participants')
    .isArray({ min: 1 })
    .withMessage('At least one participant required'),
  body('participants.*')
    .isMongoId()
    .withMessage('Invalid participant ID'),
  handleValidationErrors,
];

const validateMessage = [
  body('content')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 5000 })
    .withMessage('Message too long (max 5000 characters)'),
  body('type')
    .optional()
    .isIn(['text', 'image', 'video', 'audio', 'file'])
    .withMessage('Invalid message type'),
  body('replyTo')
    .optional()
    .isMongoId()
    .withMessage('Invalid replyTo message ID'),
  body('attachments')
    .optional()
    .isArray()
    .withMessage('Attachments must be an array'),
  body('attachments.*')
    .optional()
    .isMongoId()
    .withMessage('Invalid attachment ID'),
  handleValidationErrors,
];

const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('cursor')
    .optional()
    .isMongoId()
    .withMessage('Invalid cursor'),
  handleValidationErrors,
];

const validateMongoId = (paramName = 'id') => [
  param(paramName)
    .isMongoId()
    .withMessage(`Invalid ${paramName}`),
  handleValidationErrors,
];

module.exports = {
  handleValidationErrors,
  validateRegister,
  validateLogin,
  validateCreateRoom,
  validateMessage,
  validatePagination,
  validateMongoId,
};