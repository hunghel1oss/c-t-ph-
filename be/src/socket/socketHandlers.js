module.exports = (io) => {
    io.on('connection', (socket) => {
        console.log(`New client connected: ${socket.id}`);
        socket.on('send_message', (data) => {
            console.log(`Message received: ${data}`);
            io.emit('receive_message', data);
        });
        socket.on('disconnect', () => {
            console.log(`Client disconnected: ${socket.id}`);
        });
    });
};