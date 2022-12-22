// const logger = require('./logger.service')
const robotService = require('../api/robot/robot.service.mongodb')
// const robotService = require('../api/robot/robot.service.sql')

let gIo = null


function setupSocketAPI(http) {
    gIo = require('socket.io')(http, {
        cors: {
            origin: '*',
        }
    })
    gIo.on('connection', socket => {
        console.log(`New connected socket [id: ${socket.id}]`)
        socket.on('disconnect', socket => {
            console.log(`Socket disconnected [id: ${socket.id}]`)
        })

        socket.on('join-board', boardId => {
            console.log('joined board with id: ', boardId)
            if (socket.boardId === boardId) return;
            if (socket.boardId) {
                socket.leave(socket.boardId);
            }
            socket.join(boardId);
            socket.boardId = boardId;
        });
        socket.on('board-change', (updatedBoard) => {
            // excludedSocket.broadcast.to(room).emit(type, data)
            // async function broadcast({ type, data, room = null, userId }) {
            console.log('hey new board');
            gIo.to(socket.boardId).emit('update-board', updatedBoard)
            // broadcast( )
            // console.log('Emitting board change');
            // broadcast('board-change').to(socket.boardId).emit('updated-board', updatedBoard);
        });


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

        socket.on('set-user-socket', userId => {
            console.log(`Setting socket.userId = ${userId} for socket [id: ${socket.id}]`)
            socket.userId = userId
        })
        socket.on('unset-user-socket', () => {
            console.log(`Removing socket.userId for socket [id: ${socket.id}]`)
            delete socket.userId
        })


    })
}

function _getNumOfConnectedUsers(roomId, diff) {
    return gIo.sockets.adapter.rooms.get(roomId).size + diff
}
module.exports = {
    // set up the sockets service and define the API
    setupSocketAPI,
}