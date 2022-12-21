// const logger = require('./logger.service')
const robotService = require('../api/robot/robot.service.mongodb')
// const robotService = require('../api/robot/robot.service.sql')

let gIo = null

module.exports = {
    // set up the sockets service and define the API
    setupSocketAPI,
}

function setupSocketAPI(http) {
    gIo = require('socket.io')(http, {
        cors: {
            origin: '*',
        }
    })
    gIo.on('connection', socket => {
        // logger.info(`New connected socket [id: ${socket.id}]`)
        socket.on('disconnect', socket => {
            // logger.info(`Socket disconnected [id: ${socket.id}]`)
        })
        socket.on('chat-set-room', roomId => {
            let numOfConnectedUsers
            if (!roomId && socket.roomId) {
                numOfConnectedUsers = _getNumOfConnectedUsers(socket.roomId, -1)
                gIo.to(socket.roomId).emit('chat-subscribe-user-count', numOfConnectedUsers)
                socket.leave(socket.roomId)
                // logger.info(`Socket is leaving roomId ${socket.roomId} [socket id: ${socket.id}]`)
            } else if (roomId) {
                socket.join(roomId)
                socket.roomId = roomId
                numOfConnectedUsers = _getNumOfConnectedUsers(roomId, 0)
                gIo.to(roomId).emit('chat-subscribe-user-count', numOfConnectedUsers)
            }
        })
        socket.on('chat-send-msg', msg => {
            //sending to all the application
            // gIo.emit('chat-add-msg', msg)

            //sending to a specific room
            gIo.to(socket.roomId).emit('chat-add-msg', msg)
            
            //In this application the roomId is the robotId. Also, the chat appears no where else in the application
            robotService.addToChat(socket.roomId, msg)
        })
        socket.on('chat-fire-typing', fullname => {
            socket.broadcast.to(socket.roomId).emit('chat-subscribe-typing', fullname)
        })
    })
}

function _getNumOfConnectedUsers(roomId, diff) {
    return gIo.sockets.adapter.rooms.get(roomId).size + diff
}