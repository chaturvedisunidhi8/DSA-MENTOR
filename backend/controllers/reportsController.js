const User = require("../models/User");
const Interview = require("../models/Interview");
const Problem = require("../models/Problem");

// Get reports data
exports.getReport = async (req, res) => {
  try {
    const { type } = req.params;
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    let reportData = {};

    switch (type) {
      case "user-activity":
        reportData = await generateUserActivityReport(thirtyDaysAgo, sevenDaysAgo);
        break;

      case "problem-performance":
        reportData = await generateProblemPerformanceReport();
        break;

      case "system-usage":
        reportData = await generateSystemUsageReport();
        break;

      case "user-progress":
        reportData = await generateTopPerformersReport();
        break;

      default:
        return res.status(400).json({
          success: false,
          message: "Invalid report type",
        });
    }

    res.status(200).json({
      success: true,
      data: reportData,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Get report error:", error);
    res.status(500).json({
      success: false,
      message: "Error generating report",
      error: error.message,
    });
  }
};

// User Activity Report
async function generateUserActivityReport(thirtyDaysAgo, sevenDaysAgo) {
  const totalUsers = await User.countDocuments();
  const activeUsers = await User.countDocuments({
    lastActive: { $gte: sevenDaysAgo },
  });
  const newUsers = await User.countDocuments({
    createdAt: { $gte: thirtyDaysAgo },
  });

  // Calculate previous period for comparison
  const sixtyDaysAgo = new Date(thirtyDaysAgo.getTime() - 30 * 24 * 60 * 60 * 1000);
  const prevActiveUsers = await User.countDocuments({
    lastActive: { $gte: new Date(sevenDaysAgo.getTime() - 7 * 24 * 60 * 60 * 1000), $lt: sevenDaysAgo },
  });
  const prevNewUsers = await User.countDocuments({
    createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo },
  });

  const activeUsersChange = prevActiveUsers > 0
    ? Math.round(((activeUsers - prevActiveUsers) / prevActiveUsers) * 100)
    : 0;
  const newUsersChange = prevNewUsers > 0
    ? Math.round(((newUsers - prevNewUsers) / prevNewUsers) * 100)
    : 0;

  // Average session time (simplified - based on interview duration)
  const avgSessionStats = await Interview.aggregate([
    { $match: { status: "completed", completedAt: { $gte: thirtyDaysAgo } } },
    {
      $group: {
        _id: null,
        avgDuration: { $avg: "$timeSpent" },
      },
    },
  ]);

  const avgSession = avgSessionStats.length > 0 ? Math.round(avgSessionStats[0].avgDuration) : 0;

  return {
    type: "user-activity",
    title: "User Activity Report",
    period: "Last 30 Days",
    metrics: [
      {
        name: "Active Users",
        current: activeUsers,
        previous: prevActiveUsers,
        change: activeUsersChange,
        unit: "users",
      },
      {
        name: "New Signups",
        current: newUsers,
        previous: prevNewUsers,
        change: newUsersChange,
        unit: "users",
      },
      {
        name: "Total Users",
        current: totalUsers,
        previous: totalUsers - newUsers,
        change: newUsers > 0 ? Math.round((newUsers / (totalUsers - newUsers)) * 100) : 0,
        unit: "users",
      },
      {
        name: "Avg Session",
        current: avgSession,
        previous: avgSession,
        change: 0,
        unit: "minutes",
      },
    ],
  };
}

// Problem Performance Report
async function generateProblemPerformanceReport() {
  const problems = await Problem.find({ isActive: true }).select("title difficulty");
  const totalProblems = problems.length;

  const difficultyDistribution = {
    Easy: problems.filter((p) => p.difficulty === "Easy").length,
    Medium: problems.filter((p) => p.difficulty === "Medium").length,
    Hard: problems.filter((p) => p.difficulty === "Hard").length,
  };

  // Get submission stats from interviews
  const submissionStats = await Interview.aggregate([
    { $match: { status: "completed" } },
    { $unwind: "$responses" },
    {
      $group: {
        _id: "$responses.questionId",
        attempts: { $sum: 1 },
        avgScore: { $avg: "$responses.score" },
        successRate: {
          $avg: {
            $cond: [{ $gte: ["$responses.score", 70] }, 1, 0],
          },
        },
      },
    },
  ]);

  const avgSuccessRate = submissionStats.length > 0
    ? Math.round(
        submissionStats.reduce((sum, s) => sum + s.successRate, 0) /
          submissionStats.length * 100
      )
    : 0;

  return {
    type: "problem-performance",
    title: "Problem Performance Report",
    period: "All Time",
    metrics: [
      {
        name: "Easy Problems",
        value: difficultyDistribution.Easy,
        percentage: Math.round((difficultyDistribution.Easy / totalProblems) * 100),
      },
      {
        name: "Medium Problems",
        value: difficultyDistribution.Medium,
        percentage: Math.round((difficultyDistribution.Medium / totalProblems) * 100),
      },
      {
        name: "Hard Problems",
        value: difficultyDistribution.Hard,
        percentage: Math.round((difficultyDistribution.Hard / totalProblems) * 100),
      },
      {
        name: "Total Problems",
        value: totalProblems,
        percentage: 100,
      },
      {
        name: "Success Rate",
        value: avgSuccessRate,
        percentage: avgSuccessRate,
      },
    ],
  };
}

// System Usage Report
async function generateSystemUsageReport() {
  const mongoose = require("mongoose");
  
  // Get database stats
  const dbStats = await mongoose.connection.db.stats();
  const dbSizeGB = (dbStats.dataSize / (1024 * 1024 * 1024)).toFixed(2);
  const totalCollections = dbStats.collections;

  // Get record counts
  const totalUsers = await User.countDocuments();
  const totalProblems = await Problem.countDocuments();
  const totalInterviews = await Interview.countDocuments();
  const totalRecords = totalUsers + totalProblems + totalInterviews;

  return {
    type: "system-usage",
    title: "System Usage Report",
    period: "Current",
    metrics: [
      {
        name: "Database Size",
        value: `${dbSizeGB} GB`,
        status: parseFloat(dbSizeGB) < 1 ? "Good" : "Monitor",
      },
      {
        name: "Total Collections",
        value: totalCollections,
        status: "Active",
      },
      {
        name: "Total Records",
        value: totalRecords.toLocaleString(),
        status: "Active",
      },
      {
        name: "Users",
        value: totalUsers.toLocaleString(),
        status: "Active",
      },
      {
        name: "Problems",
        value: totalProblems.toLocaleString(),
        status: "Active",
      },
      {
        name: "Interviews",
        value: totalInterviews.toLocaleString(),
        status: "Active",
      },
    ],
  };
}

// Top Performers Report
async function generateTopPerformersReport() {
  const topUsers = await User.find({ role: "client" })
    .select("username problemsSolved accuracy streak")
    .sort({ problemsSolved: -1, accuracy: -1 })
    .limit(10);

  const performers = topUsers.map((user, index) => ({
    rank: index + 1,
    username: user.username,
    problemsSolved: user.problemsSolved,
    accuracy: user.accuracy,
    streak: user.streak,
    score: Math.round(user.problemsSolved * 0.5 + user.accuracy * 0.3 + user.streak * 0.2),
  }));

  return {
    type: "user-progress",
    title: "Top Performers Report",
    period: "All Time",
    performers,
  };
}

module.exports = exports;
