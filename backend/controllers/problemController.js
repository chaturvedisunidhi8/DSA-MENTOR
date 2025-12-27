const Problem = require("../models/Problem");
const User = require("../models/User");
const {
  runTestCases,
  ExecutionConfigError,
  ExecutionServiceError,
} = require("../utils/executionClient");
const { checkAndUnlockAchievements } = require("./achievementController");

// Get all problems (with filters)
exports.getAllProblems = async (req, res) => {
  try {
    const {
      difficulty,
      topic,
      search,
      page = 1,
      limit = 20,
      sortBy = "createdAt",
      order = "desc",
    } = req.query;
    const query = { isActive: true };
    if (difficulty) query.difficulty = difficulty;
    if (topic) query.topics = { $in: [topic] };
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }
    const problems = await Problem.find(query)
      .select("-hiddenTestCases -solution")
      .sort({ [sortBy]: order === "desc" ? -1 : 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate("createdBy", "username");
    const count = await Problem.countDocuments(query);
    res.status(200).json({
      success: true,
      data: problems,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching problems",
      error: error.message,
    });
  }
};
// Get single problem by slug
exports.getProblemBySlug = async (req, res) => {
  try {
    const problem = await Problem.findOne({
      slug: req.params.slug,
      isActive: true,
    })
      .select("-hiddenTestCases")
      .populate("createdBy", "username");
    if (!problem) {
      return res.status(404).json({
        success: false,
        message: "Problem not found",
      });
    }
    res.status(200).json({
      success: true,
      data: problem,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching problem",
      error: error.message,
    });
  }
};
// Create new problem (admin only)
exports.createProblem = async (req, res) => {
  try {
    const problemData = {
      ...req.body,
      createdBy: req.user.id,
    };
    
    const problem = await Problem.create(problemData);
    
    res.status(201).json({
      success: true,
      message: "Problem created successfully",
      data: problem,
    });
  } catch (error) {
    console.error("Create problem error:", error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "A problem with this title already exists",
      });
    }
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: messages,
      });
    }
    
    res.status(500).json({
      success: false,
      message: "Error creating problem",
      error: error.message,
    });
  }
};
// Update problem (admin only)
exports.updateProblem = async (req, res) => {
  try {
    const problem = await Problem.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!problem) {
      return res.status(404).json({
        success: false,
        message: "Problem not found",
      });
    }
    res.status(200).json({
      success: true,
      message: "Problem updated successfully",
      data: problem,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating problem",
      error: error.message,
    });
  }
};
// Delete problem (admin only)
exports.deleteProblem = async (req, res) => {
  try {
    const problem = await Problem.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    if (!problem) {
      return res.status(404).json({
        success: false,
        message: "Problem not found",
      });
    }
    res.status(200).json({
      success: true,
      message: "Problem deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting problem",
      error: error.message,
    });
  }
};
// Get all problems for admin (includes inactive)
exports.getAllProblemsAdmin = async (req, res) => {
  try {
    const { page = 1, limit = 20, sortBy = "createdAt", order = "desc" } = req.query;
    const problems = await Problem.find()
      .sort({ [sortBy]: order === "desc" ? -1 : 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate("createdBy", "username email");
    const count = await Problem.countDocuments();
    res.status(200).json({
      success: true,
      data: problems,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching problems",
      error: error.message,
    });
  }
};

// Run code against sample test cases (no stats mutation)
exports.runProblem = async (req, res) => {
  try {
    const { slug } = req.params;
    const { code, language } = req.body;

    const problem = await Problem.findOne({ slug, isActive: true }).select(
      "sampleTestCases hiddenTestCases title"
    );

    if (!problem) {
      return res.status(404).json({
        success: false,
        message: "Problem not found",
      });
    }

    const sampleTests = problem.sampleTestCases || [];

    if (sampleTests.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No sample tests available for this problem",
      });
    }

    const execution = await runTestCases({ code, language, testCases: sampleTests });
    const payloadResults = execution.results.map((r) => ({
      index: r.index,
      passed: r.passed,
      isHidden: r.isHidden,
      stdout: r.stdout,
      stderr: r.stderr,
      timeMs: r.timeMs,
      input: r.input,
      expectedOutput: r.expectedOutput,
    }));

    res.status(200).json({
      success: execution.passedCount === execution.totalTests,
      passedTests: execution.passedCount,
      totalTests: execution.totalTests,
      results: payloadResults,
    });
  } catch (error) {
    if (error instanceof ExecutionConfigError || error instanceof ExecutionServiceError) {
      return res.status(error.status || 500).json({ success: false, message: error.message });
    }
    console.error("Run problem error:", error);
    res.status(500).json({
      success: false,
      message: "Error running code",
      error: error.message,
    });
  }
};
// Get problem stats
exports.getProblemStats = async (req, res) => {
  try {
    const stats = await Problem.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: "$difficulty",
          count: { $sum: 1 },
          avgAcceptance: {
            $avg: {
              $cond: [
                { $eq: ["$stats.totalSubmissions", 0] },
                0,
                {
                  $multiply: [
                    {
                      $divide: [
                        "$stats.acceptedSubmissions",
                        "$stats.totalSubmissions",
                      ],
                    },
                    100,
                  ],
                },
              ],
            },
          },
        },
      },
    ]);
    const totalProblems = await Problem.countDocuments({ isActive: true });
    const topicStats = await Problem.aggregate([
      { $match: { isActive: true } },
      { $unwind: "$topics" },
      { $group: { _id: "$topics", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);
    res.status(200).json({
      success: true,
      data: {
        totalProblems,
        difficultyStats: stats,
        topicStats,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching problem stats",
      error: error.message,
    });
  }
};

// Submit problem solution
exports.submitProblem = async (req, res) => {
  try {
    const { slug } = req.params;
    const { code, language } = req.body;
    const userId = req.user.id;

    const problem = await Problem.findOne({ slug, isActive: true });
    if (!problem) {
      return res.status(404).json({
        success: false,
        message: "Problem not found",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const alreadySolved = user.solvedProblems.some(
      (sp) => sp.problemId.toString() === problem._id.toString()
    );

    const testCases = [
      ...(problem.sampleTestCases || []),
      ...(problem.hiddenTestCases || []),
    ];

    if (testCases.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No test cases configured for this problem",
      });
    }

    const execution = await runTestCases({ code, language, testCases });
    const success = execution.passedCount === execution.totalTests;
    const score = Math.round((execution.passedCount / execution.totalTests) * 100);

    problem.stats.totalSubmissions += 1;
    if (success) {
      problem.stats.acceptedSubmissions += 1;
    }
    problem.stats.totalAttempts += 1;
    await problem.save();

    if (success && !alreadySolved) {
      user.solvedProblems.push({
        problemId: problem._id,
        solvedAt: new Date(),
        score: score,
      });
      user.problemsSolved += 1;

      const totalSolved = user.solvedProblems.length;
      const avgScore =
        user.solvedProblems.reduce((sum, sp) => sum + (sp.score || 0), 0) /
        totalSolved;
      user.accuracy = Math.round(avgScore);

      await user.save();

      // Check and unlock achievements after solving a new problem
      checkAndUnlockAchievements(userId).catch(err => {
        console.error('Error checking achievements:', err);
      });
    }

    const payloadResults = execution.results.map((r) => ({
      index: r.index,
      passed: r.passed,
      isHidden: r.isHidden,
      stdout: r.stdout,
      stderr: r.stderr,
      timeMs: r.timeMs,
      input: r.isHidden ? undefined : r.input,
      expectedOutput: r.isHidden ? undefined : r.expectedOutput,
    }));

    res.status(200).json({
      success: true,
      passed: success,
      score,
      passedTests: execution.passedCount,
      totalTests: execution.totalTests,
      results: payloadResults,
      message: success
        ? alreadySolved
          ? "Problem solved again! Great job!"
          : "Congratulations! Problem solved successfully!"
        : `Solution failed. Passed ${execution.passedCount}/${execution.totalTests} test cases.`,
      alreadySolved,
      newlySolved: success && !alreadySolved,
    });
  } catch (error) {
    if (error instanceof ExecutionConfigError || error instanceof ExecutionServiceError) {
      return res.status(error.status || 500).json({ success: false, message: error.message });
    }
    console.error("Submit problem error:", error);
    res.status(500).json({
      success: false,
      message: "Error submitting problem",
      error: error.message,
    });
  }
};
