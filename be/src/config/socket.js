const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');
const { handleSocketConnection } = require('../controllers/socketController');

const initializeSocket = (server) => {
  const io = socketIO(server, {
    cors: {
      origin: ['http://localhost:3000', 'http://localhost:5173'], // Thêm Vite port
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'], // Support cả 2 transport
  });

  // Middleware xác thực socket (OPTIONAL - nếu muốn bắt buộc auth)
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      // Cho phép kết nối không cần token (guest)
      socket.userId = null;
      return next();
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      next();
    } catch (error) {
      console.error('Socket auth error:', error);
      socket.userId = null;
      next(); // Vẫn cho kết nối
    }
  });

  io.on('connection', (socket) => {
    console.log(`✅ Client connected: ${socket.id}`);
    handleSocketConnection(io, socket);
  });

  return io;
};

module.exports = { initializeSocket };
