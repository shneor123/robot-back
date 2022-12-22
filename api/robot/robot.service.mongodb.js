const dbService = require('../../services/mongodb.service')
const alsService = require('../../services/als.service')
const ObjectId = require('mongodb').ObjectId

const gLabels = ["On wheels", "Box game", "Art", "Baby", "Doll", "Puzzle", "Outdoor"]

const COLLECTION_NAME = 'robot'
const PAGE_SIZE = 9

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

    const criteria = {}
    const { name, labels, inStock, owner, sortBy } = filterBy

    if (name) {
        const regex = new RegExp(name, 'i')
        criteria.name = { $regex: regex }
    }

    if (inStock !== undefined && inStock !== 'all') {
        criteria.inStock = inStock === 'true'
    }

    if (labels && labels.length > 0) {
        criteria.labels = { $in: labels } //in creates an OR query. At least one elements has to be in database array
        // criteria.labels = { $all: labels } //in creates an AND query. All the elements has to be in database array
    }

    if (owner) {
        criteria['owner._id'] = ObjectId(owner._id)
        // criteria['owner._id'] = ObjectId(JSON.parse(owner)._id)
    }

    try {
        const collection = await dbService.getCollection(COLLECTION_NAME)
        let robots = await collection.find(criteria)
        if (sortBy) robots.collation({ locale: 'en' }).sort({ [sortBy]: 1 }) //collation make it case insensitive

        robots = await robots.toArray()

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
        const collection = await dbService.getCollection(COLLECTION_NAME)
        const robot = collection.findOne({ _id: ObjectId(robotId) })

        /* Since I created fake createdAt times, I don't use these lines. It's here as a reference  */
        // robot.createdAt = ObjectId(robot._id).getTimestamp()

        return robot
    } catch (err) {
        console.log(`ERROR: cannot find robot ${robotId} (robot.service - getById)`)
        throw err
    }
}

async function add(robot) {
    try {
        const { loggedInUser } = alsService.getStore()
        const collection = await dbService.getCollection(COLLECTION_NAME)

        const newRobot = {
            name: robot.name,
            img: robot.img,
            price: robot.price,
            labels: robot.labels,
            inStock: robot.inStock,
            owner: {
                _id: ObjectId(loggedInUser._id),
                fullname: loggedInUser.fullname
            },
            createdAt: Date.now(),
        }

        const res = await collection.insertOne(newRobot)
        if (!res.insertedId) return null //will cause error 401
        newRobot._id = res.insertedId
        return newRobot
    } catch (err) {
        console.log('ERROR: cannot add robot (robot.service - add)')
        throw err
    }
}

async function update(robot) {
    try {
        const criteria = { _id: ObjectId(robot._id) }
        const { loggedInUser } = alsService.getStore()
        //only the owner of the robot, or admin, can update the robot
        if (!loggedInUser.isAdmin) criteria['owner._id'] = ObjectId(loggedInUser._id)

        const collection = await dbService.getCollection(COLLECTION_NAME)
        const lastModified = Date.now()

        const res = await collection.updateOne(
            criteria,
            {
                $set: {
                    name: robot.name,
                    img: robot.img,
                    price: robot.price,
                    labels: robot.labels,
                    inStock: robot.inStock,
                    lastModified
                }
            }
        )

        if (!res.modifiedCount) return null //will cause error 401
        return { ...robot, lastModified }
    } catch (err) {
        console.log(`ERROR: cannot update robot ${robot._id} (robot.service - update)`)
        throw err
    }
}

async function remove(robotId) {
    try {
        const criteria = { _id: ObjectId(robotId) }
        const { loggedInUser } = alsService.getStore()
        //only the owner of the robot, or admin, can remove the robot
        if (!loggedInUser.isAdmin) criteria['owner._id'] = ObjectId(loggedInUser._id)

        const collection = await dbService.getCollection(COLLECTION_NAME)
        const { deletedCount } = await collection.deleteOne(criteria)
        return deletedCount
    } catch (err) {
        console.log(`ERROR: cannot remove robot ${robot._id}`)
        throw err
    }
}

async function addToChat(robotId, msg) {
    try {
        const collection = await dbService.getCollection(COLLECTION_NAME)
        await collection.updateOne({ _id: ObjectId(robotId) }, { $push: { chat: msg } })
    } catch (err) {
        console.log(`ERROR: cannot add to chat of robot ${robotId} (robot.service - remove)`)
        throw err
    }
}

async function getStatistics() {
    try {
        const collection = await dbService.getCollection(COLLECTION_NAME)
        const robots = await collection.find({}).toArray()

        const reviewsCollection = await dbService.getCollection('review')
        const reviews = await reviewsCollection.find({}).toArray()

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
                if (ObjectId(review.robotId).toString() !== ObjectId(robot._id).toString()) continue

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