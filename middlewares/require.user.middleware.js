// const logger = require('../services/logger.service')
const authService = require('../api/auth/auth.service')
const alsService = require('../services/als.service')

module.exports = {
    requireUserPasswordOrAdmin
}


async function requireUserPasswordOrAdmin(req, res, next) {
    const { loggedInUser } = alsService.getStore()
    if (!loggedInUser) return res.status(401).send('Not Authenticated')

    if (loggedInUser.isAdmin) return next()
    if (loggedInUser.username !== req.body.username) return res.status(403).end('Not Authorized')

    const { password } = req.body

    try {
        await authService.login(loggedInUser.username, password)
    } catch (err) {
        // logger.warn(`${loggedInUser.fullname} attempted to edit another user`)
        return res.status(401).end('Wrong password')
    }

    next()
}