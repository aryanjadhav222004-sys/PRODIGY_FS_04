const express = require('express')
const { body, param, query } = require('express-validator')
const router = express.Router()
const roomController = require('../controllers/roomController')
const { authenticate } = require('../middleware/auth')
const { validateCreateRoom, validatePagination, validateMongoId, handleValidationErrors } = require('../middleware/validation')

router.use(authenticate)

router.post('/', validateCreateRoom, roomController.createRoom)
router.get('/', validatePagination, roomController.getMyRooms)
router.get('/:id', validateMongoId('id'), roomController.getRoomById)
router.put('/:id', validateMongoId('id'), body('name').optional().trim().isLength({ min: 1, max: 100 }), body('description').optional().isString().isLength({ max: 500 }), body('avatar').optional().isURL(), body('settings').optional().isObject(), handleValidationErrors, roomController.updateRoom)
router.post('/:id/participants', validateMongoId('id'), body('participants').isArray({ min: 1 }), body('participants.*').isMongoId(), handleValidationErrors, roomController.addParticipants)
router.delete('/:id/participants/:userId', validateMongoId('id'), validateMongoId('userId'), roomController.removeParticipant)
router.post('/:id/leave', validateMongoId('id'), roomController.leaveRoom)
router.delete('/:id', validateMongoId('id'), roomController.deleteRoom)
router.get('/:id/participants', validateMongoId('id'), roomController.getRoomParticipants)
router.post('/:id/mute', validateMongoId('id'), body('until').optional().isISO8601(), handleValidationErrors, roomController.muteRoom)

module.exports = router