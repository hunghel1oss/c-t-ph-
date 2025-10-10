const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth.middleware');
const gameController = require('../controllers/game.controller'); 
const Room = require('../models/Room.models');
const Game = require('../models/game.model');

// ================= GAME ACTION ROUTES =================
// ✅ SỬA: Bỏ tiền tố /games vì đã mount vào /api rồi
router.post('/', protect, gameController.createGame);           // POST /api/games
router.post('/join', protect, gameController.joinGame);         // POST /api/games/join
router.post('/start', protect, gameController.startGame);       // POST /api/games/start
router.post('/roll', protect, gameController.rollDice);         // POST /api/games/roll
router.post('/process', protect, gameController.processSquare); // POST /api/games/process

// ================= ROOM ROUTES =================
router.get('/rooms', protect, async (req, res) => {
  try {
    const rooms = await Room.find({ status: 'waiting' })
      .populate('players.userId', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      rooms: rooms.map(room => ({
        roomCode: room.roomCode,
        hostId: room.hostId,
        players: room.players.map(p => ({
          userId: p.userId._id,
          name: p.userId.name,
          pet: p.pet,
          ready: p.ready,
        })),
        duration: room.duration,
        status: room.status,
        createdAt: room.createdAt,
      })),
    });
  } catch (error) {
    console.error('Get rooms error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/rooms/:roomCode', protect, async (req, res) => {
  try {
    const room = await Room.findOne({ roomCode: req.params.roomCode })
      .populate('players.userId', 'name email');

    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    res.json({
      success: true,
      room: {
        roomCode: room.roomCode,
        hostId: room.hostId,
        players: room.players.map(p => ({
          userId: p.userId._id,
          name: p.userId.name,
          pet: p.pet,
          ready: p.ready,
        })),
        duration: room.duration,
        status: room.status,
        gameId: room.gameId,
      },
    });
  } catch (error) {
    console.error('Get room error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ================= GAME STATE ROUTES =================
router.get('/:gameId', protect, async (req, res) => {
  try {
    const game = await Game.findById(req.params.gameId);

    if (!game) {
      return res.status(404).json({ success: false, message: 'Game not found' });
    }

    res.json({
      success: true,
      game: {
        gameId: game._id,
        players: game.players,
        board: game.board,
        currentTurn: game.currentTurn,
        diceRoll: game.diceRoll,
        gameLog: game.gameLog?.slice(-10) || [],
        status: game.status,
        winner: game.winner,
      },
    });
  } catch (error) {
    console.error('Get game error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/history', protect, async (req, res) => {
  try {
    const games = await Game.find({
      'players.userId': req.user.id,
      status: 'finished',
    })
      .sort({ endTime: -1 })
      .limit(10);

    res.json({
      success: true,
      games: games.map(game => ({
        gameId: game._id,
        winner: game.winner,
        players: game.players.map(p => ({
          name: p.name,
          money: p.money,
          properties: p.properties?.length || 0,
        })),
        startTime: game.startTime,
        endTime: game.endTime,
      })),
    });
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
