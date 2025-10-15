// be/src/routes/game.routes.js

const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth.middleware');
const gameController = require('../controllers/game.controller');
const startGame = require('../controllers/game.start.controller');
const game = require('../models/game.model');

// ✅ FIX: Đổi route từ '/ready' thành '/player/ready' để khớp với Frontend
router.post('/create', protect, gameController.createGame);
router.post('/join', protect, gameController.joinGame);
// FIX CHÍNH: Thay /ready bằng /player/ready
router.post('/player/ready', protect, gameController.setReady); 
router.post('/start', protect, startGame.startGame);
router.get('/rooms/:roomCode', protect, gameController.getGameByRoomCode);
router.get('/:gameId', protect, async (req, res) => {
  try {
    const { gameId } = req.params;
    const userId = req.user.id;
    
    console.log('🔍 [API] Getting game info:', { gameId, userId });
    
    const game = await Game.findById(gameId)
      .populate('players')
      .populate('boardState');
      
    if (!game) {
      return res.status(404).json({
        success: false,
        message: 'Game not found'
      });
    }
    
    const playerState = game.players.find(p => 
      p.userId && p.userId.toString() === userId
    );
    
    if (!playerState) {
      return res.status(403).json({
        success: false,
        message: 'You are not a player in this game'
      });
    }
    
    res.json({
      success: true,
      game: game,
      playerStateId: playerState._id
    });
    
  } catch (error) {
    console.error('❌ [API] Get game error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;