const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  getUserProfile,
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
  getActivityFeed,
  searchUsers,
  getSuggestedUsers
} = require('../controllers/socialController');

// Get user profile with social stats
router.get('/profile/:username', getUserProfile);

// Follow/unfollow users
router.post('/follow/:userId', auth, followUser);
router.delete('/follow/:userId', auth, unfollowUser);

// Get followers and following lists
router.get('/followers/:userId', getFollowers);
router.get('/following/:userId', getFollowing);

// Activity feed from followed users
router.get('/feed', auth, getActivityFeed);

// Search users
router.get('/search', searchUsers);

// Get suggested users to follow
router.get('/suggestions', auth, getSuggestedUsers);

module.exports = router;
