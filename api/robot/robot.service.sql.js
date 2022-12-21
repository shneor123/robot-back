const dbService = require('../../services/sql.service')
const alsService = require('../../services/als.service')

module.exports = {
    query,
    getById,
    add,
    update,
    remove
}

async function query(filterBy) {
    try {
        let sqlCmd = `SELECT review.*, user.fullname AS userFullname, robot.name AS robotName, robot.ownerId, robot.ownerFullname
                      FROM review
                      LEFT JOIN user ON review.userId=user._id
                      LEFT JOIN (SELECT robot.*, user.fullname AS ownerFullname 
                                 FROM robot 
                                 LEFT JOIN user ON robot.ownerId=user._id)
                            AS robot ON review.robotId=robot._id`

        if (Object.keys(filterBy).length) {
            const criteria = []
            sqlCmd += ' WHERE '

            if (filterBy.byUserId) criteria.push(`review.userId=${filterBy.byUserId}`)
            else if (filterBy.byRobotId) criteria.push(`review.robotId=${filterBy.byRobotId}`)

            sqlCmd += criteria.join(',')
        }

        const reviews = await dbService.runSQL(sqlCmd)
        reviews.forEach(review => {
            review.byUser = { _id: review.userId, fullname: review.userFullname }
            delete review.userId
            delete review.userFullname

            review.byRobot = { _id: review.robotId, name: review.robotName }
            review.byRobot.owner = { _id: review.ownerId, fullname: review.ownerFullname }
            delete review.robotId
            delete review.robotName
            delete review.ownerId
            delete review.ownerFullname
        })
        return reviews
    } catch (err) {
        console.log(`ERROR: cannot find reviews (robot.service - query)`)
        console.log('err', err)
        throw err
    }
}

async function getById(reviewId) {
    try {
        const sqlCmd = `SELECT * FROM review WHERE review._id=${reviewId}`
        const reviews = await dbService.runSQL(sqlCmd)
        if (reviews.length !== 1) return null //will cause error 401
        return reviews[0]
    } catch (err) {
        console.log(`ERROR: cannot find review ${reviewId} (review.service - getById)`)
        console.log('err', err)
        throw err
    }
}

async function add(review) {
    try {
        const { loggedInUser } = alsService.getStore()

        const sqlCmd = `INSERT INTO review (title, rate, content, userId, robotId)
                        VALUES ("${review.title}", ${review.rate}, "${review.content}", ${loggedInUser._id}, "${review.robotId}")`

        const res = await dbService.runSQL(sqlCmd)
        if (!res.insertId) return null //will cause error 401
        review._id = res.insertId
        review.createdAt = Date.now()
        review.byUser = {_id: loggedInUser._id, fullname: loggedInUser.fullname}
        return review
    } catch (err) {
        console.log(`ERROR: cannot add review to robot ${review.robotId} (review.service - add)`)
        console.log('err', err)
        throw err
    }
}

async function update(review) {
    try {
        const lastModified = new Date().toISOString().slice(0, 19).replace('T', ' ')

        const sqlCmd = `UPDATE review
                        SET review.title="${review.title}",
                            review.rate=${review.rate},
                            review.content="${review.content}",
                            review.lastModified="${lastModified}"
                        WHERE review._id=${review._id}`

        const res = await dbService.runSQL(sqlCmd)
        if (!res?.affectedRows) return null //will cause error 401
        return { ...review, lastModified }
    } catch (err) {
        console.log(`ERROR: cannot update review ${review._id} (review.service - update)`)
        console.log('err', err)
        throw err
    }
}

async function remove(reviewId) {
    try {
        const sqlCmd = `DELETE FROM review WHERE review._id=${reviewId}`
        const res = await dbService.runSQL(sqlCmd)
        if (!res?.affectedRows) return null //will cause error 401
        return res.affectedRows
    } catch (err) {
        console.log(`ERROR: cannot delete review ${reviewId} (review.service - delete)`)
        console.log('err', err)
        throw err
    }
}