const User = require('../models/User');
const Problem = require('../models/Problem');

/**
 * Get public user portfolio by username
 * @route GET /api/portfolio/:username
 */
exports.getPublicPortfolio = async (req, res) => {
  try {
    const { username } = req.params;

    const user = await User.findOne({ username })
      .select('-password -refreshToken -email -phone')
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if profile is public (add this field to User model later)
    // For now, all profiles are public

    // Get solved problems with details
    const solvedProblemIds = user.solvedProblems.map(sp => sp.problemId);
    const problems = await Problem.find({ _id: { $in: solvedProblemIds } })
      .select('title slug difficulty topics companies')
      .lean();

    // Map problems with user's solve data
    const solvedProblemsWithDetails = user.solvedProblems.map(sp => {
      const problem = problems.find(p => p._id.toString() === sp.problemId.toString());
      return {
        ...sp,
        problem: problem || null
      };
    }).filter(sp => sp.problem); // Remove problems that no longer exist

    // Calculate statistics
    const stats = {
      problemsSolved: user.problemsSolved || 0,
      accuracy: user.accuracy || 0,
      currentStreak: user.currentStreak || 0,
      longestStreak: user.longestStreak || 0,
      currentLevel: user.currentLevel || 'Beginner',
      interviewsCompleted: user.interviewsCompleted || 0,
      avgInterviewScore: user.avgInterviewScore || 0
    };

    // Breakdown by difficulty
    const difficultyBreakdown = {
      easy: solvedProblemsWithDetails.filter(sp => sp.problem.difficulty === 'Easy').length,
      medium: solvedProblemsWithDetails.filter(sp => sp.problem.difficulty === 'Medium').length,
      hard: solvedProblemsWithDetails.filter(sp => sp.problem.difficulty === 'Hard').length
    };

    // Topic mastery (count by topics)
    const topicMastery = {};
    solvedProblemsWithDetails.forEach(sp => {
      sp.problem.topics?.forEach(topic => {
        topicMastery[topic] = (topicMastery[topic] || 0) + 1;
      });
    });

    // Sort topics by count
    const topTopics = Object.entries(topicMastery)
      .map(([topic, count]) => ({ topic, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Recent activity (last 10 solved problems)
    const recentActivity = solvedProblemsWithDetails
      .sort((a, b) => new Date(b.solvedAt) - new Date(a.solvedAt))
      .slice(0, 10);

    res.json({
      success: true,
      data: {
        profile: {
          username: user.username,
          fullName: user.fullName,
          bio: user.bio,
          profilePicture: user.profilePicture,
          github: user.github,
          linkedin: user.linkedin,
          skills: user.skills,
          experience: user.experience,
          education: user.education
        },
        stats,
        difficultyBreakdown,
        topTopics,
        achievements: user.achievements || [],
        badges: user.badges || { bronze: 0, silver: 0, gold: 0, platinum: 0 },
        recentActivity
      }
    });
  } catch (error) {
    console.error('Get portfolio error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch portfolio',
      error: error.message
    });
  }
};

/**
 * Get shareable portfolio link
 * @route GET /api/portfolio/link
 */
exports.getPortfolioLink = async (req, res) => {
  try {
    const userId = req.user._id;
    
    const user = await User.findById(userId).select('username').lean();
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const portfolioUrl = `${process.env.CLIENT_URL}/@${user.username}`;

    res.json({
      success: true,
      data: {
        username: user.username,
        portfolioUrl,
        shareText: `Check out my DSA coding portfolio: ${portfolioUrl}`,
        linkedinShareUrl: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(portfolioUrl)}`,
        twitterShareUrl: `https://twitter.com/intent/tweet?text=${encodeURIComponent(`Check out my DSA coding portfolio!`)}&url=${encodeURIComponent(portfolioUrl)}`
      }
    });
  } catch (error) {
    console.error('Get portfolio link error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate portfolio link',
      error: error.message
    });
  }
};

/**
 * Toggle portfolio visibility (public/private)
 * @route PUT /api/portfolio/visibility
 */
exports.togglePortfolioVisibility = async (req, res) => {
  try {
    const userId = req.user._id;
    const { isPublic } = req.body;

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: { portfolioPublic: isPublic !== false } }, // Default to public
      { new: true }
    ).select('username portfolioPublic');

    res.json({
      success: true,
      message: `Portfolio is now ${user.portfolioPublic ? 'public' : 'private'}`,
      data: {
        portfolioPublic: user.portfolioPublic
      }
    });
  } catch (error) {
    console.error('Toggle visibility error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update visibility',
      error: error.message
    });
  }
};

/**
 * Get portfolio export data (JSON format for download)
 * @route GET /api/portfolio/export
 */
exports.exportPortfolio = async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId)
      .select('-password -refreshToken')
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get solved problems
    const solvedProblemIds = user.solvedProblems.map(sp => sp.problemId);
    const problems = await Problem.find({ _id: { $in: solvedProblemIds } })
      .select('title slug difficulty topics companies')
      .lean();

    const solvedProblemsWithDetails = user.solvedProblems.map(sp => {
      const problem = problems.find(p => p._id.toString() === sp.problemId.toString());
      return {
        problemTitle: problem?.title,
        difficulty: problem?.difficulty,
        topics: problem?.topics,
        companies: problem?.companies,
        solvedAt: sp.solvedAt,
        score: sp.score,
        topic: sp.topic
      };
    }).filter(sp => sp.problemTitle);

    const exportData = {
      profile: {
        username: user.username,
        fullName: user.fullName,
        email: user.email,
        bio: user.bio,
        profilePicture: user.profilePicture,
        github: user.github,
        linkedin: user.linkedin,
        skills: user.skills,
        experience: user.experience,
        education: user.education
      },
      statistics: {
        problemsSolved: user.problemsSolved,
        accuracy: user.accuracy,
        currentStreak: user.currentStreak,
        longestStreak: user.longestStreak,
        currentLevel: user.currentLevel,
        interviewsCompleted: user.interviewsCompleted,
        avgInterviewScore: user.avgInterviewScore
      },
      achievements: user.achievements,
      badges: user.badges,
      solvedProblems: solvedProblemsWithDetails,
      exportedAt: new Date().toISOString()
    };

    res.json({
      success: true,
      data: exportData
    });
  } catch (error) {
    console.error('Export portfolio error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export portfolio',
      error: error.message
    });
  }
};
