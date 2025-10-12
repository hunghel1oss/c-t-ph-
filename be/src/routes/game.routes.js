// be/src/routes/game.routes.js

const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth.middleware');
const gameController = require('../controllers/game.controller');

// ✅ FIX: Đổi route từ '/ready' thành '/player/ready' để khớp với Frontend
router.post('/create', protect, gameController.createGame);
router.post('/join', protect, gameController.joinGame);
// FIX CHÍNH: Thay /ready bằng /player/ready
router.post('/player/ready', protect, gameController.setReady); 
router.post('/start', protect, gameController.startGame);
router.get('/rooms/:roomCode', protect, gameController.getGameByRoomCode);
router.get('/:gameId', protect, gameController.getGameInfo);

module.exports = router;