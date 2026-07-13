const express = require('express')
const router = express.Router()
const { authenticate } = require('../middleware/auth')
const { validatePagination, validateMongoId } = require('../middleware/validation')
const notificationController = require('../controllers/notificationController')

router.use(authenticate)

router.get('/', validatePagination, notificationController.getNotifications)
router.put('/:id/read', validateMongoId('id'), notificationController.markAsRead)
router.put('/read-all', notificationController.markAllAsRead)
router.delete('/:id', validateMongoId('id'), notificationController.deleteNotification)

module.exports = router