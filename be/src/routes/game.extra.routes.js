/**
 * Routes for game extras.
 * Mount these routes to your app (see instructions below).
 */

const express = require('express');
const router = express.Router();
const gameExtra = require('../controllers/game.extra.controller');
const authMiddleware = require('../middlewares/auth.middleware'); // existing protect middleware

router.post('/buy-square', authMiddleware.protect, gameExtra.buySquare);
router.post('/pay-rent', authMiddleware.protect, gameExtra.payRent);
router.post('/draw-card', authMiddleware.protect, gameExtra.drawCard);
router.post('/upgrade', authMiddleware.protect, gameExtra.upgradeProperty);
router.post('/bankrupt', authMiddleware.protect, gameExtra.bankrupt);
router.post('/force-sell', authMiddleware.protect, gameExtra.forceSellProperty);
router.get('/rankings/:gameId', authMiddleware.protect, gameExtra.getRankings);
router.post('/handle-payment', authMiddleware.protect, gameExtra.handlePayment);

module.exports = router;
