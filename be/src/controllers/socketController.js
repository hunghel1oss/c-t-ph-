const Game = require('../models/game.model'); 
// Loại bỏ import gameLogic. Logic phức tạp nằm ngoài Socket Controller.

/**
 * Xử lý tất cả các sự kiện socket
 * @param {object} io - Toàn bộ instance Socket.IO
 * @param {object} socket - Socket của client hiện tại
 */
const handleSocketConnection = (io, socket) => {
  
  // ✅ 1. AUTHENTICATE & JOIN ROOM (Chịu trách nhiệm join Socket Room an toàn)
  socket.on('AUTHENTICATE_GAME', async ({ roomCode }) => {
    try {
        if (!roomCode) return console.warn('AUTHENTICATE_GAME: roomCode is missing');

        console.log(`🔌 [Socket] User ${socket.userId || socket.id} attempting to join room: ${roomCode}`);

        // Lấy thông tin game
        const game = await Game.findOne({ roomCode })
            .populate('players')
            .populate('host'); 

        if (!game) {
            socket.emit('room:error', { message: 'Không tìm thấy phòng game' });
            return;
        }
        
        // 1. Rời khỏi phòng cũ (Ngăn ngừa lỗi rò rỉ)
        Array.from(socket.rooms).forEach(room => {
            if (room !== socket.id && room !== roomCode) { 
                socket.leave(room);
            }
        });
        
        // 2. THỰC HIỆN JOIN ROOM
        socket.join(roomCode);
        socket.roomCode = roomCode; // Lưu roomCode vào socket instance

        // 3. Phát sự kiện cập nhật cho cả phòng (Real-time update số người chơi)
        io.to(roomCode).emit('GAME_UPDATED', { 
            game: game,
            message: `Người chơi mới đã tham gia phòng`
        });

        console.log(`✅ [Socket] User joined room ${roomCode}. Total in room: ${io.sockets.adapter.rooms.get(roomCode)?.size || 0}`);
    } catch (error) {
        console.error('❌ [Socket] Authenticate/Join room failed:', error);
        socket.emit('room:error', { message: 'Lỗi tham gia phòng' });
    }
});

  // 🔥 2. CHAT REAL-TIME (Logic cốt lõi)
  socket.on('chat:message', (data) => {
      const roomCode = socket.roomCode;
      if (!roomCode || !data.message) {
          return;
      }
      
      const messageData = {
          user: data.user, 
          message: data.message,
          timestamp: new Date().toISOString()
      };
      
      // Phát lại tin nhắn cho tất cả client trong phòng
      io.to(roomCode).emit('chat:message', messageData);
      console.log(`💬 [Socket Chat] Room ${roomCode}: ${data.user.name} sent: ${data.message}`);
  });

  // ----------------------------------------------------
  // ✅ CÁC SỰ KIỆN GAME (VÔ HIỆU HÓA RỦI RO CAO)
  // ----------------------------------------------------
  
  // 💡 LƯU Ý: Các hàm này chỉ xử lý thông báo, Frontend phải gọi API HTTP
  
  // ✅ 3. ROLL DICE
  socket.on('game:rollDice', () => {
    console.warn('⚠️ [Socket] game:rollDice received. Frontend should use HTTP API.');
  });
  
  // ✅ 4. LEAVE ROOM (Xử lý an toàn)
  socket.on('game:leaveRoom', (data) => {
    try {
      if (!socket.roomCode) return;
      
      // Xử lý logic leave room (bán nhà, xóa player) phải nằm trong API HTTP
      
      socket.leave(socket.roomCode);
      socket.roomCode = null; 
      
      // Gửi xác nhận về client để client tự chuyển hướng
      socket.emit('game:leftRoom', { success: true, roomCode: data.roomCode });

      // Phát sự kiện thông báo rời phòng cho những người còn lại
      io.to(data.roomCode).emit('GAME_UPDATED', { message: `Người chơi đã rời phòng` });
      
    } catch (error) {
      console.error('❌ Leave room error:', error.message);
      socket.emit('game:error', { success: false, message: error.message });
    }
  });
  
  // ✅ 5. DISCONNECT
  socket.on('disconnect', () => {
    console.log(`❌ Client disconnected: ${socket.id}`);
  });
  
  // ✅ 6. CÁC HÀNH ĐỘNG KHÁC (Vô hiệu hóa)
  socket.on('game:buyProperty', () => { console.warn('Action ignored: buyProperty'); });
  socket.on('game:upgradeProperty', () => { console.warn('Action ignored: upgradeProperty'); });
  socket.on('game:skipAction', () => { console.warn('Action ignored: skipAction'); });
};

module.exports = { handleSocketConnection };
