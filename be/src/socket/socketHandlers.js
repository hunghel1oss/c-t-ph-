/**
 * Socket.io Event Handlers
 * Xử lý các sự kiện WebSocket real-time
 */

const Game = require('../models/game.model');
const PlayerState = require('../models/playerState.model');

module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log('✅ [Socket] User connected:', socket.id);

    // ========================================
    // ROOM MANAGEMENT
    // ========================================

    /**
     * JOIN ROOM
     * Player tham gia phòng chờ
     */
    socket.on('join_room', async ({ roomCode }) => {
      try {
        console.log('📡 [Socket] join_room:', { roomCode, socketId: socket.id });

        if (!roomCode) {
          socket.emit('room:error', { 
            message: 'Room code is required' 
          });
          return;
        }

        const game = await Game.findOne({ roomCode })
          .populate({
            path: 'players',
            populate: {
              path: 'userId',
              select: 'username email avatar'
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
          console.error('❌ [Socket] Game not found:', roomCode);
          socket.emit('room:error', { 
            message: 'Game not found' 
          });
          return;
        }

        socket.join(roomCode);
        console.log('✅ [Socket] User joined room:', roomCode);

        // ✅ EMIT ROOM UPDATE
        io.to(roomCode).emit('room:update', {
          room: {
            roomCode: game.roomCode,
            players: game.players,
            status: game.status,
            host: game.host
          }
        });

      } catch (error) {
        console.error('❌ [Socket] join_room error:', error);
        socket.emit('room:error', { 
          message: error.message || 'Failed to join room' 
        });
      }
    });

    /**
     * PLAYER READY
     * Player chọn linh vật và sẵn sàng
     */
    socket.on('player:ready', async ({ roomCode, playerStateId, pet, ready }) => {
      try {
        console.log('📡 [Socket] player:ready:', { roomCode, playerStateId, pet, ready });

        if (!roomCode || !playerStateId) {
          socket.emit('room:error', { 
            message: 'Missing required fields' 
          });
          return;
        }

        const game = await Game.findOne({ roomCode })
          .populate({
            path: 'players',
            populate: {
              path: 'userId',
              select: 'username email avatar'
            }
          });

        if (!game) {
          socket.emit('room:error', { 
            message: 'Game not found' 
          });
          return;
        }

        // ✅ EMIT PLAYER READY
        io.to(roomCode).emit('player:ready', {
          players: game.players,
          playerStateId,
          pet,
          ready
        });

        console.log('✅ [Socket] player:ready emitted to room:', roomCode);

      } catch (error) {
        console.error('❌ [Socket] player:ready error:', error);
        socket.emit('room:error', { 
          message: error.message || 'Failed to update ready status' 
        });
      }
    });

    /**
     * START GAME
     * Chủ phòng bắt đầu game
     */
    socket.on('game:start', async ({ roomCode, gameId }) => {
      try {
        console.log('📡 [Socket] game:start:', { roomCode, gameId });

        if (!roomCode || !gameId) {
          socket.emit('room:error', { 
            message: 'Missing required fields' 
          });
          return;
        }

        const game = await Game.findById(gameId);

        if (!game) {
          socket.emit('room:error', { 
            message: 'Game not found' 
          });
          return;
        }

        if (game.status !== 'in_progress') {
          socket.emit('room:error', { 
            message: 'Game is not ready to start' 
          });
          return;
        }

        // ✅ EMIT GAME STARTED
        io.to(roomCode).emit('game:started', {
          gameState: {
            id: game._id,
            status: game.status,
            currentTurn: game.currentTurn,
            roomCode: game.roomCode
          }
        });

        console.log('✅ [Socket] game:started emitted to room:', roomCode);

      } catch (error) {
        console.error('❌ [Socket] game:start error:', error);
        socket.emit('room:error', { 
          message: error.message || 'Failed to start game' 
        });
      }
    });

    /**
     * LEAVE ROOM
     * Player rời phòng
     */
    socket.on('room:leave', async ({ roomCode, playerStateId }) => {
      try {
        console.log('📡 [Socket] room:leave:', { roomCode, playerStateId });

        if (!roomCode) {
          return;
        }

        socket.leave(roomCode);
        console.log('✅ [Socket] User left room:', roomCode);

        // ✅ CẬP NHẬT GAME
        const game = await Game.findOne({ roomCode })
          .populate({
            path: 'players',
            populate: {
              path: 'userId',
              select: 'username email avatar'
            }
          });

        if (game) {
          io.to(roomCode).emit('room:update', {
            room: {
              roomCode: game.roomCode,
              players: game.players,
              status: game.status,
              host: game.host
            }
          });
        }

      } catch (error) {
        console.error('❌ [Socket] room:leave error:', error);
      }
    });

    // ========================================
    // GAME ACTIONS
    // ========================================

    /**
     * ROLL DICE
     * Player tung xúc xắc
     */
    socket.on('game:roll', async ({ gameId, playerId }) => {
      try {
        console.log('📡 [Socket] game:roll:', { gameId, playerId });

        if (!gameId || !playerId) {
          socket.emit('game:error', { 
            message: 'Missing required fields' 
          });
          return;
        }

        const game = await Game.findById(gameId)
          .populate('players')
          .populate('currentTurn');

        if (!game) {
          socket.emit('game:error', { 
            message: 'Game not found' 
          });
          return;
        }

        // ✅ KIỂM TRA LƯỢT CHƠI
        if (game.currentTurn.toString() !== playerId) {
          socket.emit('game:error', { 
            message: 'Not your turn' 
          });
          return;
        }

        // ✅ TUNG XÚC XẮC (logic này nên ở GameManager)
        const dice1 = Math.floor(Math.random() * 6) + 1;
        const dice2 = Math.floor(Math.random() * 6) + 1;
        const total = dice1 + dice2;

        console.log('🎲 [Socket] Dice rolled:', { dice1, dice2, total });

        // ✅ EMIT KẾT QUẢ
        io.to(game.roomCode).emit('game:diceRolled', {
          playerId,
          dice1,
          dice2,
          total,
          isDouble: dice1 === dice2
        });

      } catch (error) {
        console.error('❌ [Socket] game:roll error:', error);
        socket.emit('game:error', { 
          message: error.message || 'Failed to roll dice' 
        });
      }
    });

    /**
     * BUY PROPERTY
     * Player mua ô đất
     */
    socket.on('game:buyProperty', async ({ gameId, playerId, squareId }) => {
      try {
        console.log('📡 [Socket] game:buyProperty:', { gameId, playerId, squareId });

        if (!gameId || !playerId || !squareId) {
          socket.emit('game:error', { 
            message: 'Missing required fields' 
          });
          return;
        }

        // ✅ LOGIC MUA ĐẤT (nên ở GameManager)
        // Tạm thời emit success
        const game = await Game.findById(gameId);
        
        io.to(game.roomCode).emit('game:propertyBought', {
          playerId,
          squareId,
          success: true
        });

      } catch (error) {
        console.error('❌ [Socket] game:buyProperty error:', error);
        socket.emit('game:error', { 
          message: error.message || 'Failed to buy property' 
        });
      }
    });

    /**
     * END TURN
     * Player kết thúc lượt
     */
    socket.on('game:endTurn', async ({ gameId, playerId }) => {
      try {
        console.log('📡 [Socket] game:endTurn:', { gameId, playerId });

        if (!gameId || !playerId) {
          socket.emit('game:error', { 
            message: 'Missing required fields' 
          });
          return;
        }

        const game = await Game.findById(gameId)
          .populate('players');

        if (!game) {
          socket.emit('game:error', { 
            message: 'Game not found' 
          });
          return;
        }

        // ✅ CHUYỂN LƯỢT (logic nên ở GameManager)
        const currentIndex = game.players.findIndex(
          p => p._id.toString() === game.currentTurn.toString()
        );
        
        const nextIndex = (currentIndex + 1) % game.players.length;
        const nextPlayer = game.players[nextIndex];

        game.currentTurn = nextPlayer._id;
        await game.save();

        console.log('✅ [Socket] Turn changed to:', nextPlayer._id);

        // ✅ EMIT TURN CHANGED
        io.to(game.roomCode).emit('game:turnChanged', {
          currentTurn: nextPlayer._id,
          currentPlayer: nextPlayer
        });

      } catch (error) {
        console.error('❌ [Socket] game:endTurn error:', error);
        socket.emit('game:error', { 
          message: error.message || 'Failed to end turn' 
        });
      }
    });

    // ========================================
    // CHAT
    // ========================================

    /**
     * SEND MESSAGE
     * Player gửi tin nhắn
     */
    socket.on('chat:message', async ({ roomCode, playerId, message }) => {
      try {
        console.log('📡 [Socket] chat:message:', { roomCode, playerId, message });

        if (!roomCode || !playerId || !message) {
          return;
        }

        const player = await PlayerState.findById(playerId)
          .populate('userId', 'username avatar');

        if (!player) {
          return;
        }

        // ✅ BROADCAST MESSAGE
        io.to(roomCode).emit('chat:newMessage', {
          playerId,
          username: player.userId.username,
          avatar: player.userId.avatar,
          message,
          timestamp: new Date().toISOString()
        });

      } catch (error) {
        console.error('❌ [Socket] chat:message error:', error);
      }
    });

    // ========================================
    // DISCONNECT
    // ========================================

    socket.on('disconnect', () => {
      console.log('❌ [Socket] User disconnected:', socket.id);
      
      // ✅ TODO: Xử lý player disconnect
      // - Đánh dấu player offline
      // - Notify các player khác
      // - Tự động end turn nếu đang là lượt của player
    });
  });
};
