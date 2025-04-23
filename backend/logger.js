let io = null;
let currentSocket = null;

function setIo(socketIo) {
    io = socketIo;
    io.on('connection', (socket) => {
        currentSocket = socket;
    });
}

function log(message) {
    console.log(message);
    if (io && currentSocket) {
        currentSocket.emit('log', message);
    }
}

module.exports = { setIo, log };
