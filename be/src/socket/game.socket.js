/**
 * game.socket.js
 * - Lắng nghe sự kiện rollDice từ client
 * - Phát event 'diceRolled' đến room gameId
 *
 * Usage in your server bootstrap (where you create io):
 *   const setupGameSocket = require('./src/socket/game.socket');
 *   setupGameSocket(io);
 */

module.exports = (io) => {
  io.on('connection', (socket) => {
    // Join/leave game room
    socket.on('joinGameRoom', ({ gameId }) => {
      if (gameId) socket.join(gameId);
    });

    socket.on('leaveGameRoom', ({ gameId }) => {
      if (gameId) socket.leave(gameId);
    });

    // Client requests a roll (server will randomize and broadcast)
    socket.on('rollDice', async (payload) => {
      // payload: { gameId, playerStateId } (validate server-side if needed)
      try {
        const d1 = Math.floor(Math.random() * 6) + 1;
        const d2 = Math.floor(Math.random() * 6) + 1;
        const total = d1 + d2;

        // broadcast to the room so all players see the result
        if (payload && payload.gameId) {
          io.to(payload.gameId).emit('diceRolled', {
            playerStateId: payload.playerStateId || null,
            dice: [d1, d2],
            total
          });
        } else {
          // no room -> broadcast to all (fallback)
          io.emit('diceRolled', { playerStateId: payload.playerStateId || null, dice: [d1, d2], total });
        }
      } catch (err) {
        console.error('rollDice socket error:', err);
        socket.emit('error', { message: 'Failed to roll dice' });
      }
    });
  });
};
