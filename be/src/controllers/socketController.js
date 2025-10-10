const gameLogic = require('../game/gameLogic');

/**
 * Handle all socket events
 */
const handleSocketConnection = (io, socket) => {
  
  // ✅ 1. CREATE ROOM
  socket.on('game:createRoom', async (data) => {
    try {
      console.log('📝 Creating room:', data);
      const { userId, duration } = data;
      
      const result = await gameLogic.createRoom(userId, duration);
      
      socket.join(result.roomCode);
      
      socket.emit('game:roomCreated', {
        success: true,
        roomCode: result.roomCode,
        room: result.room,
      });
      
      io.to(result.roomCode).emit('game:roomUpdate', {
        room: result.room,
      });
    } catch (error) {
      console.error('❌ Create room error:', error.message);
      socket.emit('game:error', {
        success: false,
        message: error.message,
      });
    }
  });

  // ✅ 2. JOIN ROOM
  socket.on('game:joinRoom', async (data) => {
    try {
      console.log('🚪 Joining room:', data);
      const { roomCode, userId } = data;
      
      const result = await gameLogic.joinRoom(roomCode, userId);
      
      socket.join(roomCode);
      
      socket.emit('game:roomJoined', {
        success: true,
        roomCode,
        room: result.room,
      });
      
      io.to(roomCode).emit('game:roomUpdate', {
        room: result.room,
      });
    } catch (error) {
      console.error('❌ Join room error:', error.message);
      socket.emit('game:error', {
        success: false,
        message: error.message,
      });
    }
  });

  // ✅ 3. START GAME
  socket.on('game:start', async (data) => {
    try {
      console.log('🎮 Starting game:', data);
      const { roomCode } = data;
      
      const result = await gameLogic.startGame(roomCode);
      
      io.to(roomCode).emit('game:started', {
        success: true,
        gameState: result.gameState,
      });
    } catch (error) {
      console.error('❌ Start game error:', error.message);
      socket.emit('game:error', {
        success: false,
        message: error.message,
      });
    }
  });

  // ✅ 4. ROLL DICE
  socket.on('game:rollDice', async (data) => {
    try {
      console.log('🎲 Rolling dice:', data);
      const { roomCode, playerId } = data;
      
      const result = await gameLogic.rollDice(roomCode, playerId);
      
      io.to(roomCode).emit('game:diceResult', {
        playerId,
        dice: result.dice,
        events: result.events,
        gameState: result.gameState,
      });
      
      io.to(roomCode).emit('game:update', result.gameState);
    } catch (error) {
      console.error('❌ Roll dice error:', error.message);
      socket.emit('game:error', {
        success: false,
        message: error.message,
      });
    }
  });

  // ✅ 5. BUY PROPERTY
  socket.on('game:buyProperty', async (data) => {
    try {
      console.log('🏠 Buying property:', data);
      const { roomCode, playerId, squareIndex } = data;
      
      const result = await gameLogic.buyProperty(roomCode, playerId, squareIndex);
      
      io.to(roomCode).emit('game:update', result.gameState);
      
      socket.emit('game:actionSuccess', {
        action: 'buy',
        squareIndex,
      });
    } catch (error) {
      console.error('❌ Buy property error:', error.message);
      socket.emit('game:error', {
        success: false,
        message: error.message,
      });
    }
  });

  // ✅ 6. UPGRADE PROPERTY
  socket.on('game:upgradeProperty', async (data) => {
    try {
      console.log('⬆️ Upgrading property:', data);
      const { roomCode, playerId, squareIndex } = data;
      
      const result = await gameLogic.upgradeProperty(roomCode, playerId, squareIndex);
      
      io.to(roomCode).emit('game:update', result.gameState);
      
      socket.emit('game:actionSuccess', {
        action: 'upgrade',
        squareIndex,
      });
    } catch (error) {
      console.error('❌ Upgrade property error:', error.message);
      socket.emit('game:error', {
        success: false,
        message: error.message,
      });
    }
  });

  // ✅ 7. SKIP ACTION
  socket.on('game:skipAction', async (data) => {
    try {
      console.log('⏭️ Skipping action:', data);
      const { roomCode, playerId } = data;
      
      const result = await gameLogic.skipAction(roomCode, playerId);
      
      io.to(roomCode).emit('game:update', result.gameState);
    } catch (error) {
      console.error('❌ Skip action error:', error.message);
      socket.emit('game:error', {
        success: false,
        message: error.message,
      });
    }
  });

  // ✅ 8. LEAVE ROOM
  socket.on('game:leaveRoom', async (data) => {
    try {
      console.log('🚶 Leaving room:', data);
      const { roomCode, userId } = data;
      
      const result = await gameLogic.leaveRoom(roomCode, userId);
      
      socket.leave(roomCode);
      
      io.to(roomCode).emit('game:roomUpdate', {
        room: result.room,
      });
      
      socket.emit('game:leftRoom', {
        success: true,
      });
    } catch (error) {
      console.error('❌ Leave room error:', error.message);
      socket.emit('game:error', {
        success: false,
        message: error.message,
      });
    }
  });

  // ✅ 9. DISCONNECT
  socket.on('disconnect', () => {
    console.log(`❌ Client disconnected: ${socket.id}`);
  });
};

module.exports = { handleSocketConnection };
