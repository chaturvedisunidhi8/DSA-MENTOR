const User = require('../models/User');

/**
 * Get global leaderboard with filters
 * @route GET /api/leaderboard
 */
exports.getGlobalLeaderboard = async (req, res) => {
  try {
    const { period = 'all', category = 'problems', limit = 50, page = 1 } = req.query;
    
    // Determine date filter for weekly/monthly
    let dateFilter = {};
    if (period === 'weekly') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      dateFilter = { updatedAt: { $gte: weekAgo } };
    } else if (period === 'monthly') {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      dateFilter = { updatedAt: { $gte: monthAgo } };
    }

    // Determine sort field based on category
    let sortField = {};
    switch (category) {
      case 'problems':
        sortField = { problemsSolved: -1, accuracy: -1 };
        break;
      case 'accuracy':
        sortField = { accuracy: -1, problemsSolved: -1 };
        break;
      case 'interviews':
        sortField = { interviewsCompleted: -1, avgInterviewScore: -1 };
        break;
      case 'streaks':
        sortField = { currentStreak: -1, longestStreak: -1 };
        break;
      default:
        sortField = { problemsSolved: -1 };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const users = await User.find(dateFilter)
      .select('username fullName profilePicture problemsSolved accuracy interviewsCompleted avgInterviewScore currentStreak longestStreak achievements')
      .sort(sortField)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Add rank to each user
    const leaderboard = users.map((user, index) => ({
      ...user,
      rank: skip + index + 1
    }));

    const totalUsers = await User.countDocuments(dateFilter);

    res.json({
      leaderboard,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalUsers / parseInt(limit)),
        totalUsers
      }
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ message: 'Failed to fetch leaderboard', error: error.message });
  }
};

/**
 * Get leaderboard for specific topic/difficulty
 * @route GET /api/leaderboard/topic/:topic
 */
exports.getTopicLeaderboard = async (req, res) => {
  try {
    const { topic } = req.params;
    const { difficulty, limit = 50, page = 1 } = req.query;

    // Build query to find users who solved problems of this topic
    const query = { 'solvedProblems.topic': topic };
    if (difficulty) {
      query['solvedProblems.difficulty'] = difficulty;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const users = await User.aggregate([
      { $match: query },
      {
        $addFields: {
          topicSolvedCount: {
            $size: {
              $filter: {
                input: '$solvedProblems',
                as: 'problem',
                cond: difficulty 
                  ? { $and: [
                      { $eq: ['$$problem.topic', topic] },
                      { $eq: ['$$problem.difficulty', difficulty] }
                    ]}
                  : { $eq: ['$$problem.topic', topic] }
              }
            }
          }
        }
      },
      { $sort: { topicSolvedCount: -1, accuracy: -1 } },
      { $skip: skip },
      { $limit: parseInt(limit) },
      {
        $project: {
          username: 1,
          fullName: 1,
          profilePicture: 1,
          topicSolvedCount: 1,
          accuracy: 1,
          problemsSolved: 1
        }
      }
    ]);

    // Add rank
    const leaderboard = users.map((user, index) => ({
      ...user,
      rank: skip + index + 1
    }));

    const totalUsers = await User.countDocuments(query);

    res.json({
      leaderboard,
      topic,
      difficulty: difficulty || 'all',
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalUsers / parseInt(limit)),
        totalUsers
      }
    });
  } catch (error) {
    console.error('Error fetching topic leaderboard:', error);
    res.status(500).json({ message: 'Failed to fetch topic leaderboard', error: error.message });
  }
};

/**
 * Get user's leaderboard position and nearby users
 * @route GET /api/leaderboard/me
 */
exports.getMyPosition = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { category = 'problems' } = req.query;

    // Determine sort field
    let sortField = {};
    switch (category) {
      case 'problems':
        sortField = { problemsSolved: -1, accuracy: -1 };
        break;
      case 'accuracy':
        sortField = { accuracy: -1, problemsSolved: -1 };
        break;
      case 'interviews':
        sortField = { interviewsCompleted: -1, avgInterviewScore: -1 };
        break;
      case 'streaks':
        sortField = { currentStreak: -1, longestStreak: -1 };
        break;
      default:
        sortField = { problemsSolved: -1 };
    }

    const currentUser = await User.findById(userId)
      .select('username fullName profilePicture problemsSolved accuracy interviewsCompleted avgInterviewScore currentStreak longestStreak')
      .lean();

    if (!currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Calculate rank
    let countQuery = {};
    switch (category) {
      case 'problems':
        countQuery = {
          $or: [
            { problemsSolved: { $gt: currentUser.problemsSolved } },
            { 
              problemsSolved: currentUser.problemsSolved,
              accuracy: { $gt: currentUser.accuracy }
            }
          ]
        };
        break;
      case 'accuracy':
        countQuery = {
          $or: [
            { accuracy: { $gt: currentUser.accuracy } },
            { 
              accuracy: currentUser.accuracy,
              problemsSolved: { $gt: currentUser.problemsSolved }
            }
          ]
        };
        break;
      case 'interviews':
        countQuery = {
          $or: [
            { interviewsCompleted: { $gt: currentUser.interviewsCompleted } },
            { 
              interviewsCompleted: currentUser.interviewsCompleted,
              avgInterviewScore: { $gt: currentUser.avgInterviewScore }
            }
          ]
        };
        break;
      case 'streaks':
        countQuery = {
          $or: [
            { currentStreak: { $gt: currentUser.currentStreak } },
            { 
              currentStreak: currentUser.currentStreak,
              longestStreak: { $gt: currentUser.longestStreak }
            }
          ]
        };
        break;
    }

    const rank = await User.countDocuments(countQuery) + 1;

    // Get nearby users (5 above and 5 below)
    const allUsers = await User.find({})
      .select('username fullName profilePicture problemsSolved accuracy interviewsCompleted avgInterviewScore currentStreak longestStreak')
      .sort(sortField)
      .lean();

    const userIndex = allUsers.findIndex(u => u._id.toString() === userId);
    const nearbyUsers = allUsers.slice(Math.max(0, userIndex - 5), userIndex + 6).map((user, index) => ({
      ...user,
      rank: Math.max(1, userIndex - 4) + index,
      isCurrentUser: user._id.toString() === userId
    }));

    res.json({
      currentUser: {
        ...currentUser,
        rank
      },
      nearbyUsers
    });
  } catch (error) {
    console.error('Error fetching user position:', error);
    res.status(500).json({ message: 'Failed to fetch user position', error: error.message });
  }
};

/**
 * Get leaderboard stats (top performers, rising stars)
 * @route GET /api/leaderboard/stats
 */
exports.getLeaderboardStats = async (req, res) => {
  try {
    // Top 3 problem solvers
    const topSolvers = await User.find({})
      .select('username fullName profilePicture problemsSolved')
      .sort({ problemsSolved: -1 })
      .limit(3)
      .lean();

    // Top 3 accuracy
    const topAccuracy = await User.find({ problemsSolved: { $gte: 10 } })
      .select('username fullName profilePicture accuracy problemsSolved')
      .sort({ accuracy: -1 })
      .limit(3)
      .lean();

    // Rising stars (most improvement in last 7 days)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const risingStars = await User.find({ updatedAt: { $gte: weekAgo } })
      .select('username fullName profilePicture problemsSolved currentStreak')
      .sort({ currentStreak: -1, problemsSolved: -1 })
      .limit(3)
      .lean();

    // Current streakers
    const topStreakers = await User.find({ currentStreak: { $gt: 0 } })
      .select('username fullName profilePicture currentStreak longestStreak')
      .sort({ currentStreak: -1 })
      .limit(3)
      .lean();

    res.json({
      topSolvers: topSolvers.map((user, idx) => ({ ...user, rank: idx + 1 })),
      topAccuracy: topAccuracy.map((user, idx) => ({ ...user, rank: idx + 1 })),
      risingStars: risingStars.map((user, idx) => ({ ...user, rank: idx + 1 })),
      topStreakers: topStreakers.map((user, idx) => ({ ...user, rank: idx + 1 }))
    });
  } catch (error) {
    console.error('Error fetching leaderboard stats:', error);
    res.status(500).json({ message: 'Failed to fetch leaderboard stats', error: error.message });
  }
};
