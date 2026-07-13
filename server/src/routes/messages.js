const express = require('express')
const router = express.Router()
const { authenticate } = require('../middleware/auth')
const { validatePagination, validateMongoId, handleValidationErrors } = require('../middleware/validation')
const { body, query } = require('express-validator')
const messageController = require('../controllers/messageController')

router.use(authenticate)

router.get('/:roomId', validateMongoId('roomId'), validatePagination, messageController.getMessages)
router.post('/:roomId', validateMongoId('roomId'), body('content').optional().isString().isLength({ max: 5000 }), body('type').optional().isIn(['text', 'image', 'video', 'audio', 'file']), body('replyTo').optional().isMongoId(), body('attachments').optional().isArray(), body('attachments.*').optional().isMongoId(), handleValidationErrors, messageController.sendMessage)
router.put('/:roomId/:messageId', validateMongoId('roomId'), validateMongoId('messageId'), body('content').isString().isLength({ min: 1, max: 5000 }), handleValidationErrors, messageController.editMessage)
router.delete('/:roomId/:messageId', validateMongoId('roomId'), validateMongoId('messageId'), query('forEveryone').optional().isBoolean(), handleValidationErrors, messageController.deleteMessage)
router.post('/:roomId/:messageId/read', validateMongoId('roomId'), validateMongoId('messageId'), messageController.markAsRead)
router.post('/:roomId/:messageId/reactions', validateMongoId('roomId'), validateMongoId('messageId'), body('emoji').isString().isLength({ min: 1, max: 4 }), handleValidationErrors, messageController.addReaction)
router.delete('/:roomId/:messageId/reactions/:emoji', validateMongoId('roomId'), validateMongoId('messageId'), validateMongoId('emoji'), messageController.removeReaction)
router.post('/:roomId/:messageId/pin', validateMongoId('roomId'), validateMongoId('messageId'), messageController.pinMessage)
router.delete('/:roomId/:messageId/pin', validateMongoId('roomId'), validateMongoId('messageId'), messageController.unpinMessage)

module.exports = router