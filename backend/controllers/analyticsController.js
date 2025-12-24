const User = require("../models/User");
const Interview = require("../models/Interview");
const Problem = require("../models/Problem");
const mongoose = require("mongoose");

// Get admin analytics data
exports.getAdminAnalytics = async (req, res) => {
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // User Activity Metrics
    const dailyActiveUsers = await User.countDocuments({
      lastActive: { $gte: oneDayAgo },
    });

    const weeklyActiveUsers = await User.countDocuments({
      lastActive: { $gte: oneWeekAgo },
    });

    const monthlyActiveUsers = await User.countDocuments({
      lastActive: { $gte: thirtyDaysAgo },
    });

    // User Growth (last 30 days)
    const userGrowth = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    // Fill in missing dates with 0 counts
    const userGrowthMap = new Map(userGrowth.map((item) => [item._id, item.count]));
    const userGrowthData = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split("T")[0];
      userGrowthData.push({
        date: dateStr,
        count: userGrowthMap.get(dateStr) || 0,
      });
    }

    // Problem Statistics
    const totalProblems = await Problem.countDocuments({ isActive: true });
    const totalInterviews = await Interview.countDocuments({ status: "completed" });
    
    // Calculate total submissions from completed interviews
    const submissionStats = await Interview.aggregate([
      { $match: { status: "completed" } },
      {
        $group: {
          _id: null,
          totalSubmissions: { $sum: { $size: "$responses" } },
          successfulSubmissions: {
            $sum: {
              $size: {
                $filter: {
                  input: "$responses",
                  as: "response",
                  cond: { $gte: ["$$response.score", 70] },
                },
              },
            },
          },
        },
      },
    ]);

    const totalSubmissions = submissionStats.length > 0 ? submissionStats[0].totalSubmissions : 0;
    const successfulSubmissions = submissionStats.length > 0 ? submissionStats[0].successfulSubmissions : 0;
    const successRate = totalSubmissions > 0 
      ? Math.round((successfulSubmissions / totalSubmissions) * 100) 
      : 0;

    // Topic Popularity (from completed interviews)
    const topicPopularity = await Interview.aggregate([
      { $match: { status: "completed", topics: { $exists: true, $ne: [] } } },
      { $unwind: "$topics" },
      {
        $group: {
          _id: "$topics",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    const totalTopicInterviews = topicPopularity.reduce((sum, t) => sum + t.count, 0);
    const topicData = topicPopularity.map((topic) => ({
      topic: topic._id,
      count: topic.count,
      percentage: totalTopicInterviews > 0 
        ? Math.round((topic.count / totalTopicInterviews) * 100) 
        : 0,
    }));

    // Performance Distribution (users by accuracy)
    const performanceDistribution = await User.aggregate([
      {
        $bucket: {
          groupBy: "$accuracy",
          boundaries: [0, 20, 40, 60, 80, 100, 101],
          default: "Other",
          output: {
            count: { $sum: 1 },
          },
        },
      },
    ]);

    const performanceData = [
      { range: "0-20%", count: 0 },
      { range: "20-40%", count: 0 },
      { range: "40-60%", count: 0 },
      { range: "60-80%", count: 0 },
      { range: "80-100%", count: 0 },
    ];

    performanceDistribution.forEach((bucket) => {
      if (bucket._id === 0) performanceData[0].count = bucket.count;
      else if (bucket._id === 20) performanceData[1].count = bucket.count;
      else if (bucket._id === 40) performanceData[2].count = bucket.count;
      else if (bucket._id === 60) performanceData[3].count = bucket.count;
      else if (bucket._id === 80) performanceData[4].count = bucket.count;
    });

    // System Health (basic metrics)
    const totalUsers = await User.countDocuments();
    const dbResponseStart = Date.now();
    await mongoose.connection.db.admin().ping();
    const dbResponseTime = Date.now() - dbResponseStart;

    const systemHealth = {
      apiResponseTime: `${dbResponseTime}ms`,
      dbPerformance: dbResponseTime < 100 ? "Excellent" : dbResponseTime < 300 ? "Good" : "Slow",
      serverLoad: "Normal", // Would need actual server metrics
      uptime: Math.floor(process.uptime() / 3600) + " hours",
      totalUsers,
      activeConnections: mongoose.connection.readyState === 1 ? "Connected" : "Disconnected",
    };

    // Compile all analytics
    const analytics = {
      userActivity: {
        daily: dailyActiveUsers,
        weekly: weeklyActiveUsers,
        monthly: monthlyActiveUsers,
        growth: userGrowthData,
      },
      problemStats: {
        totalProblems,
        totalInterviews,
        totalSubmissions,
        successRate,
      },
      topicPopularity: topicData,
      performanceDistribution: performanceData,
      systemHealth,
    };

    res.status(200).json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    console.error("Admin analytics error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching admin analytics",
      error: error.message,
    });
  }
};

module.exports = exports;
