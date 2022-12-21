const express = require('express')
const { requireAuth, requireAdmin } = require('../../middlewares/require.auth.middleware')
const { requireUserPasswordOrAdmin } = require('../../middlewares/require.user.middleware')
const { getUsers, getUserById, addUser, updateUser, updateUserAdmin, removeUser } = require('./user.controller')

const router = express.Router()

module.exports = router

router.get('/', getUsers)
router.get('/:userId', getUserById)
router.post('/', addUser)
router.put('/', requireUserPasswordOrAdmin, updateUser)
router.put('/admin', requireAdmin, updateUserAdmin)
router.delete('/:userId', requireAdmin, removeUser) //requireAuth