const User = require('../models/User');
const mongoose = require('mongoose');

/**
 * Get user profile with social stats
 * @route GET /api/social/profile/:username
 */
exports.getUserProfile = async (req, res) => {
  try {
    const { username } = req.params;
    const currentUserId = req.user?.userId;

    const user = await User.findOne({ username })
      .select('-password -refreshToken -resumeData')
      .populate('following', 'username fullName profilePicture problemsSolved')
      .populate('followers', 'username fullName profilePicture problemsSolved')
      .lean();

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if current user is following this profile
    const isFollowing = currentUserId 
      ? user.followers.some(f => f._id.toString() === currentUserId)
      : false;

    // Get recent activity (last 20 items)
    const recentActivity = user.recentActivity
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 20);

    res.json({
      profile: {
        _id: user._id,
        username: user.username,
        fullName: user.fullName,
        bio: user.bio,
        profilePicture: user.profilePicture,
        github: user.github,
        linkedin: user.linkedin,
        skills: user.skills,
        currentLevel: user.currentLevel,
        problemsSolved: user.problemsSolved,
        accuracy: user.accuracy,
        streak: user.streak,
        badges: user.badges,
        achievements: user.achievements,
        portfolioPublic: user.portfolioPublic,
        createdAt: user.createdAt
      },
      social: {
        followersCount: user.followers.length,
        followingCount: user.following.length,
        isFollowing,
        followers: user.followers.slice(0, 10), // Top 10 followers
        following: user.following.slice(0, 10)  // Top 10 following
      },
      recentActivity
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ message: 'Failed to fetch user profile', error: error.message });
  }
};

/**
 * Follow a user
 * @route POST /api/social/follow/:userId
 */
exports.followUser = async (req, res) => {
  try {
    const currentUserId = req.user.userId;
    const { userId } = req.params;

    // Validate userId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    // Can't follow yourself
    if (currentUserId === userId) {
      return res.status(400).json({ message: 'You cannot follow yourself' });
    }

    const [currentUser, targetUser] = await Promise.all([
      User.findById(currentUserId),
      User.findById(userId)
    ]);

    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if already following
    if (currentUser.following.includes(userId)) {
      return res.status(400).json({ message: 'Already following this user' });
    }

    // Add to following and followers lists
    currentUser.following.push(userId);
    targetUser.followers.push(currentUserId);

    await Promise.all([
      currentUser.save(),
      targetUser.save()
    ]);

    res.json({
      message: 'Successfully followed user',
      user: {
        _id: targetUser._id,
        username: targetUser.username,
        fullName: targetUser.fullName,
        profilePicture: targetUser.profilePicture
      }
    });
  } catch (error) {
    console.error('Error following user:', error);
    res.status(500).json({ message: 'Failed to follow user', error: error.message });
  }
};

/**
 * Unfollow a user
 * @route DELETE /api/social/follow/:userId
 */
exports.unfollowUser = async (req, res) => {
  try {
    const currentUserId = req.user.userId;
    const { userId } = req.params;

    // Validate userId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    const [currentUser, targetUser] = await Promise.all([
      User.findById(currentUserId),
      User.findById(userId)
    ]);

    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if actually following
    if (!currentUser.following.includes(userId)) {
      return res.status(400).json({ message: 'Not following this user' });
    }

    // Remove from following and followers lists
    currentUser.following = currentUser.following.filter(
      id => id.toString() !== userId
    );
    targetUser.followers = targetUser.followers.filter(
      id => id.toString() !== currentUserId
    );

    await Promise.all([
      currentUser.save(),
      targetUser.save()
    ]);

    res.json({ message: 'Successfully unfollowed user' });
  } catch (error) {
    console.error('Error unfollowing user:', error);
    res.status(500).json({ message: 'Failed to unfollow user', error: error.message });
  }
};

/**
 * Get followers list
 * @route GET /api/social/followers/:userId
 */
exports.getFollowers = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const user = await User.findById(userId)
      .populate({
        path: 'followers',
        select: 'username fullName profilePicture problemsSolved accuracy currentLevel',
        options: {
          skip: (page - 1) * limit,
          limit: parseInt(limit)
        }
      });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      followers: user.followers,
      total: user.followers.length,
      page: parseInt(page),
      totalPages: Math.ceil(user.followers.length / limit)
    });
  } catch (error) {
    console.error('Error fetching followers:', error);
    res.status(500).json({ message: 'Failed to fetch followers', error: error.message });
  }
};

/**
 * Get following list
 * @route GET /api/social/following/:userId
 */
exports.getFollowing = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const user = await User.findById(userId)
      .populate({
        path: 'following',
        select: 'username fullName profilePicture problemsSolved accuracy currentLevel',
        options: {
          skip: (page - 1) * limit,
          limit: parseInt(limit)
        }
      });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      following: user.following,
      total: user.following.length,
      page: parseInt(page),
      totalPages: Math.ceil(user.following.length / limit)
    });
  } catch (error) {
    console.error('Error fetching following:', error);
    res.status(500).json({ message: 'Failed to fetch following', error: error.message });
  }
};

/**
 * Get activity feed from followed users
 * @route GET /api/social/feed
 */
exports.getActivityFeed = async (req, res) => {
  try {
    const currentUserId = req.user.userId;
    const { page = 1, limit = 20 } = req.query;

    const currentUser = await User.findById(currentUserId).select('following');
    
    if (!currentUser || currentUser.following.length === 0) {
      return res.json({
        activities: [],
        total: 0,
        page: 1,
        totalPages: 0
      });
    }

    // Get all followed users with their recent activity
    const followedUsers = await User.find({
      _id: { $in: currentUser.following }
    })
    .select('username fullName profilePicture recentActivity')
    .lean();

    // Aggregate all activities
    const allActivities = [];
    followedUsers.forEach(user => {
      user.recentActivity.forEach(activity => {
        allActivities.push({
          ...activity,
          user: {
            _id: user._id,
            username: user.username,
            fullName: user.fullName,
            profilePicture: user.profilePicture
          }
        });
      });
    });

    // Sort by timestamp (newest first)
    allActivities.sort((a, b) => b.timestamp - a.timestamp);

    // Paginate
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedActivities = allActivities.slice(startIndex, endIndex);

    res.json({
      activities: paginatedActivities,
      total: allActivities.length,
      page: parseInt(page),
      totalPages: Math.ceil(allActivities.length / limit)
    });
  } catch (error) {
    console.error('Error fetching activity feed:', error);
    res.status(500).json({ message: 'Failed to fetch activity feed', error: error.message });
  }
};

/**
 * Search users
 * @route GET /api/social/search
 */
exports.searchUsers = async (req, res) => {
  try {
    const { query, page = 1, limit = 20 } = req.query;

    if (!query || query.trim().length < 2) {
      return res.status(400).json({ message: 'Search query must be at least 2 characters' });
    }

    const searchRegex = new RegExp(query, 'i');
    
    const users = await User.find({
      $or: [
        { username: searchRegex },
        { fullName: searchRegex }
      ]
    })
    .select('username fullName profilePicture problemsSolved accuracy currentLevel bio')
    .sort({ problemsSolved: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit))
    .lean();

    const total = await User.countDocuments({
      $or: [
        { username: searchRegex },
        { fullName: searchRegex }
      ]
    });

    res.json({
      users,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({ message: 'Failed to search users', error: error.message });
  }
};

/**
 * Get suggested users to follow
 * @route GET /api/social/suggestions
 */
exports.getSuggestedUsers = async (req, res) => {
  try {
    const currentUserId = req.user.userId;
    const { limit = 10 } = req.query;

    const currentUser = await User.findById(currentUserId).select('following skills focusAreas');
    
    // Find users with similar skills or focus areas
    const suggestions = await User.find({
      _id: { 
        $ne: currentUserId,
        $nin: currentUser.following 
      },
      $or: [
        { skills: { $in: currentUser.skills } },
        { focusAreas: { $in: currentUser.focusAreas } }
      ]
    })
    .select('username fullName profilePicture problemsSolved accuracy currentLevel skills')
    .sort({ problemsSolved: -1 })
    .limit(parseInt(limit))
    .lean();

    // If not enough suggestions, add top users
    if (suggestions.length < limit) {
      const topUsers = await User.find({
        _id: { 
          $ne: currentUserId,
          $nin: [...currentUser.following, ...suggestions.map(s => s._id)]
        }
      })
      .select('username fullName profilePicture problemsSolved accuracy currentLevel')
      .sort({ problemsSolved: -1, accuracy: -1 })
      .limit(parseInt(limit) - suggestions.length)
      .lean();

      suggestions.push(...topUsers);
    }

    res.json({ suggestions });
  } catch (error) {
    console.error('Error fetching suggestions:', error);
    res.status(500).json({ message: 'Failed to fetch suggestions', error: error.message });
  }
};

/**
 * Add activity to user's recent activity feed
 * Helper function called from other controllers
 */
exports.addUserActivity = async (userId, activityData) => {
  try {
    const user = await User.findById(userId);
    if (!user) return;

    // Add activity to beginning of array
    user.recentActivity.unshift({
      ...activityData,
      timestamp: new Date()
    });

    // Keep only last 50 activities
    if (user.recentActivity.length > 50) {
      user.recentActivity = user.recentActivity.slice(0, 50);
    }

    await user.save();
  } catch (error) {
    console.error('Error adding user activity:', error);
  }
};

module.exports = exports;
