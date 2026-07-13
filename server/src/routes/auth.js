const express = require('express')
const { body, query, param } = require('express-validator')
const router = express.Router()
const authController = require('../controllers/authController')
const { authenticate } = require('../middleware/auth')
const { validateRegister, validateLogin, handleValidationErrors } = require('../middleware/validation')

// Public routes
router.post('/register', validateRegister, authController.register)
router.post('/login', validateLogin, authController.login)
router.post('/refresh', body('refreshToken').notEmpty(), handleValidationErrors, authController.refreshToken)

// Protected routes
router.post('/logout', authenticate, authController.logout)
router.get('/me', authenticate, authController.getMe)
router.put('/me', authenticate, body('username').optional().trim().isLength({ min: 3, max: 30 }), body('avatar').optional().isURL(), body('customStatus').optional().isString().isLength({ max: 100 }), body('settings').optional().isObject(), handleValidationErrors, authController.updateProfile)
router.put('/password', authenticate, body('currentPassword').notEmpty(), body('newPassword').isLength({ min: 8, max: 128 }), handleValidationErrors, authController.changePassword)
router.get('/search', authenticate, query('q').isString().isLength({ min: 2, max: 50 }), query('limit').optional().isInt({ min: 1, max: 50 }), handleValidationErrors, authController.searchUsers)

module.exports = router