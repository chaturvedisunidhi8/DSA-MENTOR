const Problem = require("../models/Problem");
const User = require("../models/User");

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

    // Find the problem
    const problem = await Problem.findOne({ slug, isActive: true });
    if (!problem) {
      return res.status(404).json({
        success: false,
        message: "Problem not found",
      });
    }

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check if problem was already solved
    const alreadySolved = user.solvedProblems.some(
      (sp) => sp.problemId.toString() === problem._id.toString()
    );

    // Simple code execution simulation (replace with actual execution engine)
    const totalTests = problem.hiddenTestCases?.length || problem.sampleTestCases?.length || 5;
    const passedTests = code && code.length > 20 ? totalTests : Math.floor(totalTests * 0.6);
    const success = passedTests === totalTests;
    const score = Math.round((passedTests / totalTests) * 100);

    // Update problem stats
    problem.stats.totalSubmissions += 1;
    if (success) {
      problem.stats.acceptedSubmissions += 1;
    }
    problem.stats.totalAttempts += 1;
    await problem.save();

    // If successful and not already solved, add to user's solved problems
    if (success && !alreadySolved) {
      user.solvedProblems.push({
        problemId: problem._id,
        solvedAt: new Date(),
        score: score,
      });
      user.problemsSolved += 1;
      
      // Update accuracy
      const totalSolved = user.solvedProblems.length;
      const avgScore = user.solvedProblems.reduce((sum, sp) => sum + (sp.score || 0), 0) / totalSolved;
      user.accuracy = Math.round(avgScore);
      
      await user.save();
    }

    res.status(200).json({
      success: true,
      passed: success,
      score,
      passedTests,
      totalTests,
      message: success
        ? alreadySolved
          ? "Problem solved again! Great job!"
          : "Congratulations! Problem solved successfully!"
        : `Solution failed. Passed ${passedTests}/${totalTests} test cases.`,
      alreadySolved,
      newlySolved: success && !alreadySolved,
    });
  } catch (error) {
    console.error("Submit problem error:", error);
    res.status(500).json({
      success: false,
      message: "Error submitting problem",
      error: error.message,
    });
  }
};
