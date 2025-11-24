const Problem = require("../models/Problem");
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
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "A problem with this title already exists",
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
