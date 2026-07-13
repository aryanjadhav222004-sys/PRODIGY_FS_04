const express = require('express')
const router = express.Router()

router.use('/auth', require('./auth'))
router.use('/rooms', require('./rooms'))
router.use('/messages', require('./messages'))
router.use('/users', require('./users'))
router.use('/notifications', require('./notifications'))

module.exports = router