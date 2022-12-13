const { ObjectId } = require('mongodb')
const dbService = require('../../services/mongodb.service')
const alsService = require('../../services/als.service')

const COLLECTION_NAME = 'review'

module.exports = {
    query,
    getById,
    add,
    update,
    remove
}

async function query(filterBy) {
    try {
        const criteria = _buildCriteria(filterBy)
        const collection = await dbService.getCollection(COLLECTION_NAME)

        let reviews = await collection.aggregate([
            {
                $match: criteria
            },
            {
                $lookup:
                {
                    localField: 'userId',
                    from: 'user',
                    foreignField: '_id',
                    as: 'byUser'
                }
            },
            {
                $unwind: '$byUser'
                //by default Mongo returns an array of results. 
                //But since we are sure we will get only one user per review (since we search by ID), 
                //unwind will convert the array to object
            },
            {
                $lookup:
                {
                    localField: 'robotId',
                    from: 'robot',
                    foreignField: '_id',
                    as: 'byRobot',
                },
            },
            {
                $unwind: '$byRobot',
            },
        ])
        reviews = await reviews.toArray()

        reviews = reviews.map(review => {
            review.byUser = { _id: review.byUser._id, fullname: review.byUser.fullname }
            review.byRobot = { _id: review.byRobot._id, name: review.byRobot.name, price: review.byRobot.price, owner: review.byRobot.owner }
            review.createdAt = ObjectId(review._id).getTimestamp()
            delete review.userId
            delete review.robotId
            return review
        })

        return reviews
    } catch (err) {
        console.log(`ERROR: cannot find reviews (robot.service - query)`)
        console.log('err', err)
        throw err
    }
}

function _buildCriteria(filterBy) {
    const criteria = {}
    if (filterBy.byUserId) criteria.userId = ObjectId(filterBy.byUserId)
    if (filterBy.byRobotId) criteria.robotId = ObjectId(filterBy.byRobotId)
    return criteria
}

async function getById(reviewId) {
    try {
        const collection = await dbService.getCollection(COLLECTION_NAME)
        const review = collection.findOne({ _id: ObjectId(reviewId) })
        review.createdAt = ObjectId(review._id).getTimestamp()
        return review
    } catch (err) {
        console.log(`ERROR: cannot find review ${reviewId} (review.service - getById)`)
        console.log('err', err)
        throw err
    }
}

async function add(review) {
    try {
        const {loggedInUser} = alsService.getStore()
        
        const collection = await dbService.getCollection(COLLECTION_NAME)

        const newReview = {
            userId: ObjectId(loggedInUser._id),
            robotId: ObjectId(review.robotId),
            title: review.title,
            rate: review.rate,
            content: review.content
        }

        const res = await collection.insertOne(newReview)
        if (!res.insertedId) return null //will cause error 401
        newReview._id = res.insertedId
        newReview.byUser = {_id: loggedInUser._id, fullname: loggedInUser.fullname}
        newReview.createdAt = ObjectId(res.insertedId).getTimestamp()
        return newReview
    } catch (err) {
        console.log(`ERROR: cannot add review ${review.robotId} (review.service - add)`)
        console.log('err', err)
        throw err
    }
}

async function update(review) {
    try {
        const collection = await dbService.getCollection(COLLECTION_NAME)
        const lastModified = Date.now()

        const updatedReview = {
            title: review.title,
            rate: review.rate,
            content: review.content,
            lastModified
        }
        const res = await collection.updateOne({ _id: ObjectId(review._id) }, { $set: { ...updatedReview } })
        if (!res.modifiedCount) return null //will cause error 401
        return { ...review, lastModified }
    } catch (err) {
        console.log(`ERROR: cannot update review ${review._id} (review.service - update)`)
        console.log('err', err)
        throw err
    }
}

async function remove(reviewId) {
    try {
        const collection = await dbService.getCollection(COLLECTION_NAME)
        const { deletedCount } = await collection.deleteOne({ _id: ObjectId(reviewId) })
        return deletedCount
    } catch (err) {
        console.log(`ERROR: cannot delete review ${reviewId} (review.service - delete)`)
        console.log('err', err)
        throw err
    }
}