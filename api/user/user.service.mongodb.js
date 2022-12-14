const { ObjectId } = require('mongodb')
const bcrypt = require('bcrypt')
const dbService = require('../../services/mongodb.service')

const COLLECTION_NAME = 'user'

module.exports = {
    query,
    getById,
    getByUsername,
    add,
    update,
    updateAdmin,
    remove
}

async function query() {
    try {
        /* FIX - add filterBy if needed */
        const collection = await dbService.getCollection(COLLECTION_NAME)
        let users = await collection.find().toArray()
        users = users.map(user => {
            delete user.password
            user.createdAt = ObjectId(user._id).getTimestamp()
            return user
        })
        return users
    } catch (err) {
        console.log(`ERROR: cannot find users (user.service - query)`)
        console.log('err', err)
        // logger.error(`cannot find users`, err)
        throw err
    }
}

async function getById(userId) {
    try {
        const collection = await dbService.getCollection(COLLECTION_NAME)
        const user = collection.findOne({ _id: ObjectId(userId) })
        delete user.password
        return user
    } catch (err) {
        console.log(`ERROR: cannot find user ${userId} (user.service - getById)`)
        console.log('err', err)
        throw err
    }
}

async function getByUsername(username) {
    try {
        const collection = await dbService.getCollection(COLLECTION_NAME)
        const user = await collection.findOne({ username })
        return user
    } catch (err) {
        console.log(`ERROR: cannot find user ${username} (user.service - getByUsername)`)
        console.log('err', err)
        throw err
    }
}

async function add(user) {
    try {
        const newUser = {
            username: user.username,
            password: user.password,
            fullname: user.fullname,
            isAdmin: false
        }
        const collection = await dbService.getCollection(COLLECTION_NAME)
        const res = await collection.insertOne(newUser)
        if (!res.insertedId) return null //will cause error 401
        newUser._id = res.insertedId
        return newUser
    } catch (err) {
        console.log(`ERROR: cannot add user (user.service - add)`)
        console.log('err', err)
        throw err
    }
}

async function update(user) {
    try {
        const lastModified = Date.now()

        const updatedUser = {
            _id: ObjectId(user._id),
            username: user.username,
            fullname: user.fullname,
            lastModified
        }

        if (user.newPassword) {
            const saltRounds = 10
            const hash = await bcrypt.hash(user.newPassword, saltRounds)
            updatedUser.password = hash
        }

        const collection = await dbService.getCollection(COLLECTION_NAME)
        const res = await collection.updateOne({ _id: updatedUser._id }, { $set: updatedUser })
        if (!res.modifiedCount) return null //will cause error 401
        delete user.password
        return { ...user, lastModified }
    } catch (err) {
        console.log(`ERROR: cannot update user (user.service - update)`)
        console.log('err', err)
        throw err
    }
}

async function updateAdmin(user) {
    try {
        const lastModified = Date.now()

        const updatedUser = {
            _id: ObjectId(user._id),
            isAdmin: user.isAdmin,
            lastModified
        }

        const collection = await dbService.getCollection(COLLECTION_NAME)
        const res = await collection.updateOne({ _id: updatedUser._id }, { $set: updatedUser })
        if (!res.acknowledged) return null //will cause error 401
        return { ...user, lastModified }
    } catch (err) {
        console.log(`ERROR: cannot update user admin mode (user.service - updateAdmin)`)
        console.log('err', err)
        throw err
    }
}

async function remove(userId) {
    try {
        const collection = await dbService.getCollection(COLLECTION_NAME)
        const deletedCount = await collection.deleteOne({ _id: ObjectId(userId) })
        return deletedCount
    } catch (err) {
        console.log(`ERROR: cannot delete user (user.service - remove)`)
        console.log('err', err)
        throw err
    }
}