const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');
// File này sẽ chứa logic join room và các listener chính
const { handleSocketConnection } = require('../controllers/socketController'); 

const initializeSocket = (server) => {
  const io = socketIO(server, {
    cors: {
      // Dùng biến môi trường để hỗ trợ môi trường production
      origin: process.env.FRONTEND_URL ? [process.env.FRONTEND_URL, 'http://localhost:3000', 'http://localhost:5173'] : ['http://localhost:3000', 'http://localhost:5173'],
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'], // Support cả 2 transport
  });

  // Middleware xác thực socket (OPTIONAL - nếu muốn bắt buộc auth)
  io.use((socket, next) => {
    // Socket.io Client thường đặt token trong handshake.auth hoặc handshake.query
    const token = socket.handshake.auth.token || socket.handshake.query.token; 
    
    if (!token) {
      // Cho phép kết nối không cần token (guest)
      socket.userId = null;
      return next();
    }

    try {
      // Sử dụng JWT_SECRET để giải mã token
      const decoded = jwt.verify(token, process.env.JWT_SECRET); 
      socket.userId = decoded.id;
      // Dữ liệu người dùng được lưu vào socket instance
      socket.user = decoded; 
      next();
    } catch (error) {
      console.error('Socket auth error (invalid token):', error.message);
      // Gửi lỗi về client
      return next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`✅ Client connected: ${socket.id} (User ID: ${socket.userId || 'Guest'})`);
    
    // Gửi đối tượng io và socket đến Controller để xử lý logic game
    handleSocketConnection(io, socket); 

    socket.on('disconnect', (reason) => {
      console.log(`❌ Client disconnected: ${socket.id} (Reason: ${reason})`);
    });
  });

  return io;
};

module.exports = { initializeSocket };