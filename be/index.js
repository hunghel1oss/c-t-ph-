const express = require('express');
const app = express();
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const routes = require('./src/routes');       // import index.js trong routes
const setupSockets = require('./src/socket'); // import index.js trong socket

dotenv.config();

const port = process.env.PORT || 3000;
const server = http.createServer(app);

// Cấu hình CORS cho Express
app.use(cors({
  origin: 'http://localhost:5173', // Vite mặc định chạy ở port 5173
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// cấu hình socket.io
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }
});

// setup socket
setupSockets(io);

// middleware
app.use(express.json());

// connect DB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// routes
app.use('/auth', routes.auth);
app.use('/game', routes.game);

// start server
server.listen(port, () => {
  console.log(`🚀 Server is running at http://localhost:${port}`);
});
