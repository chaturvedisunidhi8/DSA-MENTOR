const express = require('express');
const router = express.Router();
const leaderboardController = require('../controllers/leaderboardController');
const { authenticate } = require('../middleware/auth');

// Public routes
router.get('/', leaderboardController.getGlobalLeaderboard);
router.get('/stats', leaderboardController.getLeaderboardStats);
router.get('/topic/:topic', leaderboardController.getTopicLeaderboard);

// Protected routes
router.get('/me', authenticate, leaderboardController.getMyPosition);

module.exports = router;
