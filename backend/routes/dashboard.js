const express = require("express");
const router = express.Router();
const authenticate = require("../middleware/auth");
const checkRole = require("../middleware/roleCheck");
const User = require("../models/User");

// Client dashboard - accessible by both client and superadmin
router.get(
  "/client",
  authenticate,
  checkRole("client", "superadmin"),
  async (req, res) => {
    try {
      const user = await User.findById(req.user.id).select(
        "-password -refreshToken"
      );

      res.status(200).json({
        success: true,
        data: {
          user,
          dashboardType: "client",
          stats: {
            problemsSolved: user.problemsSolved,
            accuracy: user.accuracy,
            streak: user.streak,
            currentLevel: user.currentLevel,
            focusAreas: user.focusAreas,
          },
        },
      });
    } catch (error) {
      console.error("Client dashboard error:", error);
      res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message,
      });
    }
  }
);

// Superadmin dashboard - accessible only by superadmin
router.get(
  "/superadmin",
  authenticate,
  checkRole("superadmin"),
  async (req, res) => {
    try {
      // Get all users (excluding passwords and refresh tokens)
      const allUsers = await User.find()
        .select("-password -refreshToken")
        .sort({ createdAt: -1 });

      // Calculate statistics
      const totalUsers = allUsers.length;
      const clientUsers = allUsers.filter((u) => u.role === "client").length;
      const superAdmins = allUsers.filter(
        (u) => u.role === "superadmin"
      ).length;
      const avgProblemsSolved =
        totalUsers > 0
          ? Math.round(
              allUsers.reduce((sum, u) => sum + u.problemsSolved, 0) /
                totalUsers
            )
          : 0;
      const avgAccuracy =
        totalUsers > 0
          ? Math.round(
              allUsers.reduce((sum, u) => sum + u.accuracy, 0) / totalUsers
            )
          : 0;

      // Get active users (last 24 hours)
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const activeUsers = allUsers.filter(
        (u) => new Date(u.lastActive) > oneDayAgo
      ).length;

      res.status(200).json({
        success: true,
        data: {
          dashboardType: "superadmin",
          stats: {
            totalUsers,
            clientUsers,
            superAdmins,
            activeUsers,
            avgProblemsSolved,
            avgAccuracy,
          },
          users: allUsers,
        },
      });
    } catch (error) {
      console.error("Superadmin dashboard error:", error);
      res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message,
      });
    }
  }
);

// Public statistics - no authentication required
router.get("/public-stats", async (req, res) => {
  try {
    const Problem = require("../models/Problem");

    // Get total problems count
    const totalProblems = await Problem.countDocuments({ isActive: true });

    // Get unique topics count
    const topicsResult = await Problem.aggregate([
      { $match: { isActive: true } },
      { $unwind: "$topics" },
      { $group: { _id: "$topics" } },
      { $count: "total" },
    ]);
    const topics = topicsResult.length > 0 ? topicsResult[0].total : 0;

    // Get difficulty distribution
    const difficultyStats = await Problem.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: "$difficulty",
          count: { $sum: 1 },
        },
      },
    ]);

    const difficulties = {
      easy: 0,
      medium: 0,
      hard: 0,
    };

    difficultyStats.forEach((stat) => {
      if (stat._id === "Easy") difficulties.easy = stat.count;
      if (stat._id === "Medium") difficulties.medium = stat.count;
      if (stat._id === "Hard") difficulties.hard = stat.count;
    });

    res.status(200).json({
      success: true,
      totalProblems,
      topics,
      difficulties,
    });
  } catch (error) {
    console.error("Public stats error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching public statistics",
      error: error.message,
    });
  }
});

module.exports = router;
