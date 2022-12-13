const mysql = require('mysql')

module.exports = {
    runSQL
}

const connection = mysql.createConnection({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: '',
    database: 'robo_store',
    insecureAuth: true,
})

connection.connect(err => {
    if (err) throw new Error('mySql failed connection')
    console.log('connected to SQL server')
})

function runSQL(sqlCommand) {
    return new Promise((resolve, reject) => {
        connection.query(sqlCommand, function (error, results) {
            if (error) reject(error)
            else resolve(results)
        })
    })
}