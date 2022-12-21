const express = require('express')
const { requireAuth, requireAdmin } = require('../../middlewares/require.auth.middleware')
//log
const { getLabels, getRobots, getRobotById, addRobot, updateRobot, removeRobot, getRobotStatistics } = require('../robot/robot.controller')
const router = express.Router()

module.exports = router

router.get('/labels', getLabels)
router.get('/', getRobots) //log
router.get('/statistics', getRobotStatistics)
router.get('/:robotId', getRobotById)
router.post('/', requireAuth, addRobot) //requireAdmin
router.put('/', requireAuth, updateRobot) //requireAdmin
router.delete('/:robotId', requireAuth, removeRobot) //requireAdmin
