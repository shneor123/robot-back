const dbService = require('../../services/sql.service')
const alsService = require('../../services/als.service')

const gLabels = ["On wheels", "Box game", "Art", "Baby", "Doll", "Puzzle", "Outdoor"]

const PAGE_SIZE = 30

module.exports = {
    getLabels,
    query,
    getById,
    add,
    update,
    remove,
    addToChat,
    getStatistics
}

function getLabels() {
    return Promise.resolve(gLabels.sort())
}

async function query(filterBy) {

    let criteriaCmds = []
    const { name, labels, inStock, owner, sortBy } = filterBy

    if (name) criteriaCmds.push(`robot.name LIKE '%${name}%'`)

    if (labels && labels.length > 0) {
        JSON.parse(labels).forEach(label => criteriaCmds.push(`robot.labels LIKE '%\"${label}\"%'`))
    }
    if (inStock) criteriaCmds.push(`robot.inStock = ${inStock}`)
    if (owner) criteriaCmds.push(`robot.ownerId = ${owner._id}`)

    let criteria = ''
    if (criteriaCmds.length) criteria = criteriaCmds.join(' AND ')

    try {
        let sqlCmd = `SELECT robot.*, user.fullname as ownerFullname 
                      FROM robot LEFT JOIN user ON robot.ownerId=user._id`

        if (criteria) sqlCmd += ' WHERE ' + criteria

        let robots = await dbService.runSQL(sqlCmd)
        robots.forEach(robot => {
            robot.labels = JSON.parse(robot.labels)

            /* I do the next nesting object since I've started with mongoDB, 
               so the frontend expects this kind of structure*/
            robot.owner = { _id: robot.ownerId, fullname: robot.ownerFullname }
            delete robot.ownerId
            delete robot.ownerFullname
        })

        let pageIdx = +filterBy.pageIdx
        const numOfPages = Math.ceil(robots.length / PAGE_SIZE)

        if (pageIdx < 0) pageIdx = numOfPages
        else if (pageIdx > numOfPages - 1) pageIdx = 0
        filterBy = { ...filterBy, pageIdx, numOfPages }

        robots = robots.slice(PAGE_SIZE * pageIdx, PAGE_SIZE * (pageIdx + 1))

        return { robots, filterBy }
    } catch (err) {
        console.log(`ERROR: cannot find robots (robot.service - query)`)
        console.log('err', err)
        throw err
    }
}

async function getById(robotId) {
    try {
        let sqlCmd = `SELECT robot.*, user.fullname as ownerFullname
                      FROM robot
                      LEFT JOIN user ON robot.ownerId=user._id
                      WHERE robot._id = ${robotId}`

        const robots = await dbService.runSQL(sqlCmd)
        if (robots?.length !== 1) return null //will cause error 401
        const robot = robots[0]
        robot.labels = JSON.parse(robot.labels)

        /* I do this nesting object since I've started with mongoDB, so the frontend expects this kind of structure*/
        robot.owner = { _id: robot.ownerId, fullname: robot.ownerFullname }
        delete robot.ownerId
        delete robot.ownerFullname
        robot.chat = await _getRobotChat(robotId)
        return robot
    } catch (err) {
        console.log(`ERROR: cannot find robot ${robotId} (robot.service - getById)`)
        console.log('err', err)
        throw err
    }
}

async function add(robot) {
    try {
        const { loggedInUser } = alsService.getStore()

        const newRobot = {
            name: robot.name,
            price: robot.price,
            inStock: robot.inStock ? 1 : 0,
            labels: robot.labels,
            img: robot.img,
            ownerId: loggedInUser._id
        }
        console.log('newRobot', newRobot)

        const sqlCmd = `INSERT INTO robot (name, price, inStock, labels, img, ownerId)
                        VALUES ("${newRobot.name}",
                                "${newRobot.price}",
                                "${newRobot.inStock}",
                                '${JSON.stringify(newRobot.labels)}',
                                "${newRobot.img}",
                                "${loggedInUser._id}"
                        )`

        const res = await dbService.runSQL(sqlCmd)
        if (!res.insertId) return null //will cause error 401
        newRobot._id = res.insertId
        return newRobot
    } catch (err) {
        console.log('ERROR: cannot add robot (robot.service - add)')
        console.log('err', err)
        throw err
    }
}

async function update(robot) {
    try {
        const { loggedInUser } = alsService.getStore()
        const lastModified = new Date().toISOString().slice(0, 19).replace('T', ' ')

        let sqlCmd = `UPDATE robot
                      SET name="${robot.name}",
                          img="${robot.img}",
                          price="${robot.price}",
                          labels='${JSON.stringify(robot.labels)}',
                          inStock="${robot.inStock ? 1 : 0}",
                          lastModified="${lastModified}"
                      WHERE robot._id=${robot._id}`

        //only the owner of the robot, or admin, can update the robot
        if (!loggedInUser.isAdmin) sqlCmd += ` AND robot.ownerId=${loggedInUser._id}`

        const res = await dbService.runSQL(sqlCmd)
        if (!res?.affectedRows) return null //will cause error 401
        return { robot, lastModified }
    } catch (err) {
        console.log(`ERROR: cannot update robot ${robot._id} (robot.service - update)`)
        console.log('err', err)
        throw err
    }
}

async function remove(robotId) {
    try {
        const { loggedInUser } = alsService.getStore()

        let sqlCmd = `DELETE FROM robot WHERE robot._id=${robotId}`

        //only the owner of the robot, or admin, can update the robot
        if (!loggedInUser.isAdmin) sqlCmd += ` AND robot.ownerId=${loggedInUser._id}`

        const res = await dbService.runSQL(sqlCmd)
        if (!res?.affectedRows) return null //will cause error 401
        return res.affectedRows
    } catch (err) {
        console.log(`ERROR: cannot remove robot ${robot._id} (robot.service - remove)`)
        console.log('err', err)
        throw err
    }
}

async function addToChat(robotId, msg) {
    try {
        const txt = msg.txt
        const userId = msg.user?._id || null

        const sqlCmd = `INSERT INTO chat (txt, userId, robotId)
                        VALUES ("${txt}", ${userId}, ${robotId})`

        await dbService.runSQL(sqlCmd)
        _getRobotChat(1)
    } catch (err) {
        console.log(`ERROR: cannot add to chat of robot ${robotId} (robot.service - addToChat)`)
        console.log('err', err)
        throw err
    }
}

async function _getRobotChat(robotId) {
    try {
        const sqlCmd = `SELECT chat.*, user.fullname FROM chat 
                        LEFT JOIN user ON chat.userId=user._id
                        WHERE robotId=${robotId}`

        const chat = await dbService.runSQL(sqlCmd)
        chat.forEach(msg => {
            if (msg.userId) msg.user = { _id: msg.userId, fullname: msg.fullname }
            delete msg.userId
            delete msg.robotId
            delete msg.fullname
        })
        return chat
    } catch (err) {
        console.log(`ERROR: cannot get chat of robot ${robotId} (robot.service - _getRobotChat)`)
        console.log('err', err)
        throw err
    }
}

async function getStatistics() {
    try {
        let sqlCmd = 'SELECT * FROM robot'
        const robots = await dbService.runSQL(sqlCmd)
        robots.forEach(robot => robot.labels = JSON.parse(robot.labels))

        sqlCmd = 'SELECT * FROM review'
        const reviews = await dbService.runSQL(sqlCmd)

        const statisticData = {
            length: robots.length || 0,
            mostExpensive: { price: -Infinity },
            leastExpensive: { price: Infinity },
            labelMap: {}, //totalPrice: 0, totalInStock, count: 0
            highestRate: { robot: {}, avgRate: 0 }
        }

        robots.reduce((acc, robot) => {
            if (robot.price > acc.mostExpensive.price) acc.mostExpensive = robot
            if (robot.price < acc.leastExpensive.price) acc.leastExpensive = robot


            //labels
            robot.labels.forEach(label => {
                if (acc.labelMap[label]) {
                    const currLabelData = acc.labelMap[label]
                    currLabelData.totalPrice += +robot.price
                    if (robot.inStock) currLabelData.totalInStock++
                    currLabelData.count++
                } else {
                    const currLabelData = { totalPrice: +robot.price, count: 1 }

                    if (robot.inStock) currLabelData.totalInStock = 1
                    else currLabelData.totalInStock = 0 //so in the next round we can do property++

                    acc.labelMap[label] = currLabelData
                }
            })

            //rate
            const totalRateData = { totalRate: 0, count: 0 }

            for (let i = reviews.length - 1; i >= 0; i--) {
                const review = reviews[i]
                if (review.robotId !== robot._id) continue

                totalRateData.totalRate += +review.rate
                totalRateData.count++

                reviews.splice(i, 1) //we splice to make the array shorter (less loops)
            }

            const robotRateAvg = totalRateData.totalRate / totalRateData.count

            if (robotRateAvg > acc.highestRate.avgRate) acc.highestRate = { robot, avgRate: robotRateAvg }

            return acc
        }, statisticData)


        //labels - calculating averages
        for (const key of Object.keys(statisticData.labelMap)) {
            const label = statisticData.labelMap[key]
            label.avgPricePerType = label.totalPrice / label.count
            label.inStockPercentage = label.totalInStock / label.count * 100
            delete label.totalPrice
            delete label.totalInStock
            delete label.count
        }

        return statisticData
    } catch (err) {
        console.log(`ERROR: cannot get statistic data of robots (robot.service - getStatistics)`)
        console.log('err', err)
        throw err
    }
}