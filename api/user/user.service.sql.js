const bcrypt = require('bcrypt')
const dbService = require('../../services/sql.service')

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
        const sqlCmd = `SELECT _id, username, fullname, isAdmin, lastModified FROM user`
        const users = await dbService.runSQL(sqlCmd)
        users.forEach(user => user.isAdmin = !!user.isAdmin)
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
        const sqlCmd = `SELECT _id, username, fullname, isAdmin, lastModified FROM user WHERE _id="${userId}"`
        const users = await dbService.runSQL(sqlCmd)
        if (users?.length !== 1) return null
        const user = users[0]
        return { ...user, isAdmin: !!user.isAdmin }
    } catch (err) {
        console.log(`ERROR: cannot find user ${userId} (user.service - getByUsername)`)
        console.log('err', err)
        throw err
    }
}

async function getByUsername(username) {
    try {
        const sqlCmd = `SELECT * FROM user WHERE username="${username}"`
        const users = await dbService.runSQL(sqlCmd)
        if (users?.length !== 1) return null
        const user = users[0]
        return { ...user, isAdmin: !!user.isAdmin }
    } catch (err) {
        console.log(`ERROR: cannot find user ${username} (user.service - getByUsername)`)
        console.log('err', err)
        throw err
    }
}

async function add(user) {
    try {
        const sqlCmd = `INSERT INTO user (username, password, fullname)
            VALUES ("${user.username}", "${user.password}", "${user.fullname}")`

        const res = await dbService.runSQL(sqlCmd)
        if (!res.insertId) return null //will cause error 401

        const newUser = {
            _id: res.insertId,
            username: user.username,
            fullname: user.fullname,
            isAdmin: false
        }

        return newUser
    } catch (err) {
        console.log(`ERROR: cannot add user (user.service - add)`)
        console.log('err', err)
        throw err
    }
}

async function update(user) {
    try {
        const lastModified = new Date().toISOString().slice(0, 19).replace('T', ' ')

        let sqlCmd = `UPDATE user
                      SET username="${user.username}",
                          fullname="${user.fullname}",
                          lastModified="${lastModified}"`

        if (user.newPassword) {
            const saltRounds = 10
            const hash = await bcrypt.hash(user.newPassword, saltRounds)
            sqlCmd += `, password="${hash}"`
        }

        sqlCmd += ` WHERE user._id=${user._id}`

        const res = await dbService.runSQL(sqlCmd)
        if (!res?.affectedRows) return null //will cause error 401
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
        const lastModified = new Date().toISOString().slice(0, 19).replace('T', ' ')

        const sqlCmd = `UPDATE user 
                        SET isAdmin=${user.isAdmin}, lastModified="${lastModified}"
                        WHERE _id=${user._id}`

        const res = await dbService.runSQL(sqlCmd)
        if (!res?.affectedRows) return null //will cause error 401
        return { ...user, lastModified }
    } catch (err) {
        console.log(`ERROR: cannot update user admin mode (user.service - updateAdmin)`)
        console.log('err', err)
        throw err
    }
}

async function remove(userId) {
    try {
        const sqlCmd = `DELETE FROM user WHERE _id=${userId}`
        const res = await dbService.runSQL(sqlCmd)
        if (!res?.affectedRows) return null //will cause error 401
        return res.affectedRows
    } catch (err) {
        console.log(`ERROR: cannot delete user (user.service - remove)`)
        console.log('err', err)
        throw err
    }
}