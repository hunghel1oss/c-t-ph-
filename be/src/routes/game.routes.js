const express = require('express');
const router = express.Router();
const gameController = require('../controllers/game.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const gameExtra = require('./game.extra.routes');

router.post('/create', authMiddleware.protect, gameController.createGame);
router.post('/join', authMiddleware.protect, gameController.joinGame);
router.post('/start', authMiddleware.protect, gameController.startGame);
router.post('/roll-dice', authMiddleware.protect, gameController.rollDice);
router.post('/process-square', authMiddleware.protect, gameController.processSquare);

router.use('/extra', gameExtra);

module.exports = router;