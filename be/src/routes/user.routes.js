const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth.middleware');
const User = require('../models/user.model');

/**
 * Get user profile
 */
router.get('/:userId', protect, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        stats: user.stats,
        isOnline: user.isOnline,
      },
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * Update user profile
 */
router.put('/profile', protect, async (req, res) => {
  try {
    const { name, avatar } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { name, avatar },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * Get leaderboard
 */
router.get('/leaderboard/top', async (req, res) => {
  try {
    const users = await User.find()
      .sort({ 'stats.gamesWon': -1 })
      .limit(10)
      .select('name avatar stats');

    res.json({
      success: true,
      leaderboard: users.map((user, index) => ({
        rank: index + 1,
        userId: user._id,
        name: user.name,
        avatar: user.avatar,
        gamesWon: user.stats.gamesWon,
        gamesPlayed: user.stats.gamesPlayed,
        winRate: user.stats.gamesPlayed > 0 
          ? ((user.stats.gamesWon / user.stats.gamesPlayed) * 100).toFixed(1)
          : 0,
      })),
    });
  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

module.exports = router;
