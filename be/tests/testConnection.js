const io = require('socket.io-client');

const SOCKET_URL = 'http://localhost:5000';
const TOKEN = 'your_jwt_token_here'; // Replace with actual token

const socket = io(SOCKET_URL, {
  auth: {
    token: TOKEN,
  },
  transports: ['websocket'],
});

socket.on('connect', () => {
  console.log('✅ Connected to server:', socket.id);
  
  // Test create room
  socket.emit('game:createRoom', {
    userId: '507f1f77bcf86cd799439011', // Replace with actual userId
    duration: 20,
  });
});

socket.on('game:roomCreated', (data) => {
  console.log('✅ Room created:', data);
});

socket.on('game:error', (error) => {
  console.error('❌ Error:', error);
});

socket.on('disconnect', () => {
  console.log('❌ Disconnected from server');
});

socket.on('connect_error', (error) => {
  console.error('❌ Connection error:', error.message);
});
