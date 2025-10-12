const gameLogic = require('../game/gameLogic');

/**
 * Handle all socket events
 */
const handleSocketConnection = (io, socket) => {
  
  // ✅ 1. CREATE ROOM
  socket.on('join_room', async ({ roomCode }) => {
    try {
        console.log(`🔌 [Socket] User ${socket.userId} joining room: ${roomCode}`);

        const game = await Game.findOne({ roomCode })
            .populate({
                path: 'players',
                populate: {
                    path: 'userId',
                    select: 'username email avatar' // ✅ ĐÚNG FIELD
                }
            })
            .populate({
                path: 'host',
                populate: {
                    path: 'userId',
                    select: 'username email avatar'
                }
            });

        if (!game) {
            socket.emit('room:error', { message: 'Không tìm thấy phòng' });
            return;
        }

        socket.join(roomCode);
        socket.roomCode = roomCode;

        // ✅ EMIT ROOM UPDATE VỚI FULL DATA
        io.to(roomCode).emit('room:update', { 
            room: game,
            message: `User joined room`
        });

        console.log(`✅ [Socket] User joined room ${roomCode}`);
    } catch (error) {
        console.error('❌ [Socket] Join room failed:', error);
        socket.emit('room:error', { message: 'Lỗi tham gia phòng' });
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
