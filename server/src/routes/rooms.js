const express = require('express')
const { body, param, query } = require('express-validator')
const router = express.Router()
const roomController = require('../controllers/roomController')
const { authenticate } = require('../middleware/auth')
const { validateCreateRoom, validatePagination, validateMongoId, handleValidationErrors } = require('../middleware/validation')
const asyncHandler = require('../utils/asyncHandler')

router.use(authenticate)

router.post('/', validateCreateRoom, asyncHandler(roomController.createRoom))
router.get('/', validatePagination, asyncHandler(roomController.getMyRooms))
router.get('/:id', validateMongoId('id'), asyncHandler(roomController.getRoomById))
router.put('/:id', validateMongoId('id'), body('name').optional().trim().isLength({ min: 1, max: 100 }), body('description').optional().isString().isLength({ max: 500 }), body('avatar').optional().isURL(), body('settings').optional().isObject(), handleValidationErrors, asyncHandler(roomController.updateRoom))
router.post('/:id/participants', validateMongoId('id'), body('participants').isArray({ min: 1 }), body('participants.*').isMongoId(), handleValidationErrors, asyncHandler(roomController.addParticipants))
router.delete('/:id/participants/:userId', validateMongoId('id'), validateMongoId('userId'), asyncHandler(roomController.removeParticipant))
router.post('/:id/leave', validateMongoId('id'), asyncHandler(roomController.leaveRoom))
router.delete('/:id', validateMongoId('id'), asyncHandler(roomController.deleteRoom))
router.get('/:id/participants', validateMongoId('id'), asyncHandler(roomController.getRoomParticipants))
router.post('/:id/mute', validateMongoId('id'), body('until').optional().isISO8601(), handleValidationErrors, asyncHandler(roomController.muteRoom))

module.exports = router