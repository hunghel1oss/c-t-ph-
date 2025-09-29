const express = require('express');
const app = express();
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const routes = require('./src/routes'); // existing routes
const setupSockets = require('./src/socket'); // existing socket setup
const GameManager = require('./src/game/GameManager');

dotenv.config();

const port = process.env.PORT || 3000;
const server = http.createServer(app);

// CORS configuration
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Socket.io configuration
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
  }
});

// Initialize GameManager with socket.io instance
const gameManager = new GameManager(io);

// Make gameManager available globally for routes
app.locals.gameManager = gameManager;

// Setup existing socket handlers + new game handlers
setupSockets(io, gameManager);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Routes
app.use('/auth', routes.auth);
app.use('/game', routes.game);

// New game management routes
app.get('/api/rooms', (req, res) => {
  const rooms = gameManager.getAllRooms();
  res.json({ rooms });
});

app.get('/api/rooms/:roomId', (req, res) => {
  const room = gameManager.getRoom(req.params.roomId);
  if (!room) {
    return res.status(404).json({ message: 'Room not found' });
  }
  res.json({ room });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    activeRooms: gameManager.getAllRooms().length
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  server.close(() => {
    mongoose.connection.close();
    process.exit(0);
  });
});

// Start server
server.listen(port, () => {
  console.log(`🚀 Server is running at http://localhost:${port}`);
  console.log(`🎮 Game Manager initialized`);
  console.log(`📡 Socket.io ready for connections`);
});

module.exports = { app, server, io, gameManager };
