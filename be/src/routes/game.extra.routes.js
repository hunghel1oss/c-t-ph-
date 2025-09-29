/**
 * Routes for game extras.
 * Mount these routes to your app (see instructions below).
 */

const express = require('express');
const router = express.Router();
const gameExtra = require('../controllers/game.extra.controller');
const authMiddleware = require('../middlewares/auth.middleware'); // existing protect middleware

router.post('/buy', authMiddleware.protect, gameExtra.buyProperty);
router.post('/pay-rent', authMiddleware.protect, gameExtra.payRent);
router.post('/draw-card', authMiddleware.protect, gameExtra.drawCard);
router.post('/upgrade', authMiddleware.protect, gameExtra.upgradeProperty);
router.post('/bankrupt', authMiddleware.protect, gameExtra.bankrupt);

module.exports = router;
