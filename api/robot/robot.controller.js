const robotService = require('./robot.service.mongodb')
// const robotService = require('./robot.service.sql')
// const logger = require('../../services/logger.service')

module.exports = {
    getLabels,
    getRobots,
    getRobotById,
    addRobot,
    updateRobot,
    removeRobot,
    getRobotStatistics
}

async function getLabels(req, res) {
    try {
        const labels = await robotService.getLabels()
        res.send(labels)
    } catch (err) {
        // logger.error('Failed to get labels', err)
        res.status(500).send({ err: 'Failed to get labels' })
    }
}

async function getRobots(req, res) {
    try {
        const filterBy = req.query
        const robots = await robotService.query(filterBy || '{}')
        res.send(robots)
    } catch (err) {
        console.log('err', err)
        // logger.error('Failed to get robots', err)
        res.status(500).send({ err: 'Failed to get robots' })
    }
}

async function getRobotById(req, res) {
    try {
        const robot = await robotService.getById(req.params.robotId)
        if (!robot) return res.status(401).send('Failed to get robot')
        res.send(robot)
    } catch (err) {
        // logger.error('Failed to get robot', err)
        res.status(500).send({ err: 'Failed to get robot' })
    }
}

async function addRobot(req, res) {
    try {
        const robot = req.body
        const savedRobot = await robotService.add(robot)
        if (!savedRobot) return res.status(401).send('Failed to add robot')
        res.send(savedRobot)
    } catch (err) {
        // logger.error('Failed to add robot', err)
        res.status(500).send({ err: 'Failed to add robot' })
    }
}

async function updateRobot(req, res) {
    try {
        const robot = req.body
        const savedRobot = await robotService.update(robot)
        if (!savedRobot) return res.status(401).send('Failed to update robot')
        res.send(savedRobot)
    } catch (err) {
        // logger.error('Failed to update robot', err)
        res.status(500).send({ err: 'Failed to update robot' })
    }
}

async function removeRobot(req, res) {
    try {
        const deletedCount = await robotService.remove(req.params.robotId)
        if (!deletedCount) return res.status(401).send('Failed to remove robot')
        res.send('robot removed successfully')
    } catch (err) {
        // logger.error('Failed to remove robot', err)
        res.status(500).send({ err: 'Failed to remove robot' })
    }
}

async function getRobotStatistics(req, res) {
    try {
        const statistics = await robotService.getStatistics()
        res.send(statistics)
    } catch (err) {
        // logger.error('Failed to remove robot', err)
        res.status(500).send({ err: 'Failed getting robot statistics' })
    }
}