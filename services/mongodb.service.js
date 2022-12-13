const MongoClient = require('mongodb').MongoClient

const config = require('../config')

module.exports = {
    getCollection
}

const dbName = 'robo_store'

let dbConn = null

async function getCollection(collectionName) {
    try {
        const db = await _connect()
        const collection = await db.collection(collectionName)
        return collection
    } catch (err) {
        /* FIX - should I import logger? */
        // logger.error('Failed to get Mongo collection', err)
        throw err
    }
}

async function _connect() {
    if (dbConn) return dbConn
    try {
        const client = await MongoClient.connect(config.dbURLMongo, { useNewUrlParser: true, useUnifiedTopology: true })
        return client.db(dbName)
    } catch (err) {
        /* FIX - should I import logger? */
        // logger.error('Cannot connect to DB', err)
        throw err
    }
}