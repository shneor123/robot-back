// const logger = require('../services/logger.service')
const alsService = require('../services/als.service')

module.exports = {
    requireAuth,
    requireAdmin,
}

async function requireAuth(req, res, next) {
    const { loggedInUser } = alsService.getStore()
    if (!loggedInUser) return res.status(401).send('Not Authenticated')
    next()
}

async function requireAdmin(req, res, next) {
    const { loggedInUser } = alsService.getStore()
    
    if (!loggedInUser) return res.status(401).send('Not Authenticated')

    if (!loggedInUser.isAdmin) {
        // logger.warn(`${loggedinUser.fullname} attempted to perform admin action`)
        res.status(403).end('Not Authorized') //notice the end, which means that there are no following middlewares
        return
    }

    next()
}