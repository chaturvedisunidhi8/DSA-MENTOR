const User = require("../models/User");
const Interview = require("../models/Interview");

// Define all achievements
const ACHIEVEMENTS = [
  {
    id: "first_blood",
    icon: "🎯",
    title: "First Blood",
    description: "Solve your first problem",
    category: "Getting Started",
    requirement: { type: "problems_solved", count: 1 },
    badge: "bronze",
  },
  {
    id: "problem_solver",
    icon: "🧩",
    title: "Problem Solver",
    description: "Solve 10 problems",
    category: "Progress",
    requirement: { type: "problems_solved", count: 10 },
    badge: "bronze",
  },
  {
    id: "coding_ninja",
    icon: "🥷",
    title: "Coding Ninja",
    description: "Solve 50 problems",
    category: "Progress",
    requirement: { type: "problems_solved", count: 50 },
    badge: "silver",
  },
  {
    id: "master_coder",
    icon: "👑",
    title: "Master Coder",
    description: "Solve 100 problems",
    category: "Progress",
    requirement: { type: "problems_solved", count: 100 },
    badge: "gold",
  },
  {
    id: "week_warrior",
    icon: "🔥",
    title: "Week Warrior",
    description: "Maintain a 7-day streak",
    category: "Consistency",
    requirement: { type: "streak", count: 7 },
    badge: "silver",
  },
  {
    id: "month_master",
    icon: "💪",
    title: "Month Master",
    description: "Maintain a 30-day streak",
    category: "Consistency",
    requirement: { type: "streak", count: 30 },
    badge: "gold",
  },
  {
    id: "perfectionist",
    icon: "✨",
    title: "Perfectionist",
    description: "Achieve 100% accuracy on 5 interviews",
    category: "Excellence",
    requirement: { type: "perfect_interviews", count: 5 },
    badge: "platinum",
  },
  {
    id: "speed_demon",
    icon: "⚡",
    title: "Speed Demon",
    description: "Complete an interview in under 30 minutes",
    category: "Speed",
    requirement: { type: "fast_interview", minutes: 30 },
    badge: "silver",
  },
  {
    id: "interview_pro",
    icon: "🎓",
    title: "Interview Pro",
    description: "Complete 10 mock interviews",
    category: "Practice",
    requirement: { type: "interviews_completed", count: 10 },
    badge: "silver",
  },
  {
    id: "topic_master",
    icon: "📚",
    title: "Topic Master",
    description: "Master all topics with 90%+ accuracy",
    category: "Mastery",
    requirement: { type: "topic_mastery", accuracy: 90 },
    badge: "platinum",
  },
  {
    id: "early_bird",
    icon: "🌅",
    title: "Early Bird",
    description: "Complete an interview before 8 AM",
    category: "Special",
    requirement: { type: "early_completion", hour: 8 },
    badge: "bronze",
  },
  {
    id: "night_owl",
    icon: "🦉",
    title: "Night Owl",
    description: "Complete an interview after 10 PM",
    category: "Special",
    requirement: { type: "late_completion", hour: 22 },
    badge: "bronze",
  },
];

// Get all achievements definitions
exports.getAllAchievements = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      data: ACHIEVEMENTS,
    });
  } catch (error) {
    console.error("Get achievements error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching achievements",
      error: error.message,
    });
  }
};

// Get user's achievement progress
exports.getUserAchievements = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).select(
      "achievements badges problemsSolved streak solvedProblems"
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Get user's interviews for achievement calculations
    const interviews = await Interview.find({
      userId,
      status: "completed",
    }).select("overallScore timeSpent completedAt accuracy");

    // Calculate achievement progress
    const achievementsWithProgress = ACHIEVEMENTS.map((achievement) => {
      const unlocked = user.achievements.some(
        (a) => a.achievementId === achievement.id
      );
      const unlockedAchievement = user.achievements.find(
        (a) => a.achievementId === achievement.id
      );

      let progress = 0;
      let current = 0;
      let target = 0;

      // Calculate progress based on requirement type
      switch (achievement.requirement.type) {
        case "problems_solved":
          current = user.problemsSolved;
          target = achievement.requirement.count;
          progress = Math.min((current / target) * 100, 100);
          break;

        case "streak":
          current = user.streak;
          target = achievement.requirement.count;
          progress = Math.min((current / target) * 100, 100);
          break;

        case "interviews_completed":
          current = interviews.length;
          target = achievement.requirement.count;
          progress = Math.min((current / target) * 100, 100);
          break;

        case "perfect_interviews":
          current = interviews.filter((i) => i.accuracy === 100).length;
          target = achievement.requirement.count;
          progress = Math.min((current / target) * 100, 100);
          break;

        case "fast_interview":
          const hasFastInterview = interviews.some(
            (i) => i.timeSpent <= achievement.requirement.minutes
          );
          progress = hasFastInterview ? 100 : 0;
          current = hasFastInterview ? 1 : 0;
          target = 1;
          break;

        case "topic_mastery":
          // Simplified - would need more complex calculation in production
          progress = user.accuracy >= achievement.requirement.accuracy ? 100 : 0;
          current = user.accuracy;
          target = achievement.requirement.accuracy;
          break;

        case "early_completion":
        case "late_completion":
          const hour = achievement.requirement.hour;
          const hasTimeCompletion = interviews.some((i) => {
            const completedHour = new Date(i.completedAt).getHours();
            return achievement.requirement.type === "early_completion"
              ? completedHour < hour
              : completedHour >= hour;
          });
          progress = hasTimeCompletion ? 100 : 0;
          current = hasTimeCompletion ? 1 : 0;
          target = 1;
          break;

        default:
          progress = 0;
      }

      return {
        ...achievement,
        unlocked,
        date: unlockedAchievement?.unlockedAt || null,
        progress: Math.round(progress),
        current,
        target,
      };
    });

    res.status(200).json({
      success: true,
      data: {
        achievements: achievementsWithProgress,
        badges: user.badges,
        stats: {
          totalAchievements: ACHIEVEMENTS.length,
          unlockedAchievements: user.achievements.length,
          completionRate: Math.round(
            (user.achievements.length / ACHIEVEMENTS.length) * 100
          ),
        },
      },
    });
  } catch (error) {
    console.error("Get user achievements error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching user achievements",
      error: error.message,
    });
  }
};

// Check and unlock achievements for a user
exports.checkAndUnlockAchievements = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) return;

    const interviews = await Interview.find({
      userId,
      status: "completed",
    }).select("overallScore timeSpent completedAt accuracy");

    const newlyUnlocked = [];

    for (const achievement of ACHIEVEMENTS) {
      // Skip if already unlocked
      if (
        user.achievements.some((a) => a.achievementId === achievement.id)
      ) {
        continue;
      }

      let shouldUnlock = false;

      // Check if achievement should be unlocked
      switch (achievement.requirement.type) {
        case "problems_solved":
          shouldUnlock = user.problemsSolved >= achievement.requirement.count;
          break;

        case "streak":
          shouldUnlock = user.streak >= achievement.requirement.count;
          break;

        case "interviews_completed":
          shouldUnlock = interviews.length >= achievement.requirement.count;
          break;

        case "perfect_interviews":
          shouldUnlock =
            interviews.filter((i) => i.accuracy === 100).length >=
            achievement.requirement.count;
          break;

        case "fast_interview":
          shouldUnlock = interviews.some(
            (i) => i.timeSpent <= achievement.requirement.minutes
          );
          break;

        case "topic_mastery":
          shouldUnlock = user.accuracy >= achievement.requirement.accuracy;
          break;

        case "early_completion":
        case "late_completion":
          const hour = achievement.requirement.hour;
          shouldUnlock = interviews.some((i) => {
            const completedHour = new Date(i.completedAt).getHours();
            return achievement.requirement.type === "early_completion"
              ? completedHour < hour
              : completedHour >= hour;
          });
          break;
      }

      if (shouldUnlock) {
        user.achievements.push({
          achievementId: achievement.id,
          unlockedAt: new Date(),
        });

        // Update badge count
        if (achievement.badge && user.badges[achievement.badge] !== undefined) {
          user.badges[achievement.badge]++;
        }

        newlyUnlocked.push(achievement);
      }
    }

    if (newlyUnlocked.length > 0) {
      await user.save();
    }

    return newlyUnlocked;
  } catch (error) {
    console.error("Check achievements error:", error);
    return [];
  }
};

module.exports = exports;
