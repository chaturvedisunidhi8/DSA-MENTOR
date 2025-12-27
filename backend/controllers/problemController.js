const Problem = require("../models/Problem");
const User = require("../models/User");
const {
  runTestCases,
  ExecutionConfigError,
  ExecutionServiceError,
} = require("../utils/executionClient");
const { checkAndUnlockAchievements } = require("./achievementController");
const csv = require("csv-parser");
const fs = require("fs");
const path = require("path");

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

      // Add to recent activity for social feed
      user.recentActivity.unshift({
        type: 'solved_problem',
        problemId: problem._id,
        details: `Solved ${problem.title} (${problem.difficulty})`,
        timestamp: new Date()
      });
      
      // Keep only last 50 activities
      if (user.recentActivity.length > 50) {
        user.recentActivity = user.recentActivity.slice(0, 50);
      }

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

/**
 * Report problem asked in real interview (crowdsourcing)
 * @route POST /api/problems/:slug/report-interview
 */
exports.reportInterview = async (req, res) => {
  try {
    const { slug } = req.params;
    const { company, interviewDate, position, interviewRound } = req.body;
    const userId = req.user._id;

    if (!company || !interviewDate) {
      return res.status(400).json({
        success: false,
        message: 'Company and interview date are required'
      });
    }

    const problem = await Problem.findOne({ slug, isActive: true });
    if (!problem) {
      return res.status(404).json({
        success: false,
        message: 'Problem not found'
      });
    }

    // Check if user already reported this problem for the same company within 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const existingReport = problem.interviewReports.find(
      report => report.userId.toString() === userId.toString() &&
                report.company === company &&
                report.interviewDate >= thirtyDaysAgo
    );

    if (existingReport) {
      return res.status(400).json({
        success: false,
        message: 'You already reported this problem for this company recently'
      });
    }

    // Add the report
    problem.interviewReports.push({
      userId,
      company,
      interviewDate: new Date(interviewDate),
      position: position || '',
      interviewRound: interviewRound || 'Other',
      reportedAt: new Date(),
      verified: false
    });

    await problem.save();

    res.json({
      success: true,
      message: 'Thank you for contributing! Your report helps the community.',
      totalReports: problem.interviewReports.length,
      recentFrequency: problem.recentFrequency
    });
  } catch (error) {
    console.error('Report interview error:', error);
    res.status(500).json({
      success: false,
      message: 'Error submitting report',
      error: error.message
    });
  }
};

/**
 * Get interview frequency data for a problem
 * @route GET /api/problems/:slug/frequency
 */
exports.getInterviewFrequency = async (req, res) => {
  try {
    const { slug } = req.params;
    const { days = 90 } = req.query;

    const problem = await Problem.findOne({ slug, isActive: true })
      .select('title slug interviewReports');

    if (!problem) {
      return res.status(404).json({
        success: false,
        message: 'Problem not found'
      });
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - parseInt(days));

    const recentReports = problem.interviewReports.filter(
      report => report.interviewDate >= cutoffDate
    );

    // Group by company
    const frequencyByCompany = {};
    const roundDistribution = {};
    const positionData = {};

    recentReports.forEach(report => {
      // Company frequency
      frequencyByCompany[report.company] = (frequencyByCompany[report.company] || 0) + 1;
      
      // Round distribution
      roundDistribution[report.interviewRound] = (roundDistribution[report.interviewRound] || 0) + 1;
      
      // Position tracking
      if (report.position) {
        positionData[report.position] = (positionData[report.position] || 0) + 1;
      }
    });

    // Sort companies by frequency
    const topCompanies = Object.entries(frequencyByCompany)
      .map(([company, count]) => ({ company, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Get most recent reports
    const recentInterviews = recentReports
      .sort((a, b) => b.interviewDate - a.interviewDate)
      .slice(0, 5)
      .map(report => ({
        company: report.company,
        date: report.interviewDate,
        position: report.position,
        round: report.interviewRound
      }));

    res.json({
      success: true,
      data: {
        totalReports: problem.interviewReports.length,
        recentReports: recentReports.length,
        period: `Last ${days} days`,
        topCompanies,
        roundDistribution,
        recentInterviews
      }
    });
  } catch (error) {
    console.error('Get frequency error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching frequency data',
      error: error.message
    });
  }
};

/**
 * Bulk upload problems from CSV or JSON file
 * @route POST /api/problems/bulk-upload
 */
exports.bulkUploadProblems = async (req, res) => {
  let filePath = null;
  
  try {
    // Validate file upload
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded. Please upload a CSV or JSON file."
      });
    }

    filePath = req.file.path;
    const fileExtension = path.extname(req.file.originalname).toLowerCase();
    
    let problems = [];

    // Parse file based on type
    if (fileExtension === '.csv') {
      problems = await parseCSVFile(filePath);
    } else if (fileExtension === '.json') {
      problems = await parseJSONFile(filePath);
    } else {
      return res.status(400).json({
        success: false,
        message: "Invalid file format. Only CSV and JSON files are supported."
      });
    }

    // Validate parsed problems
    if (!problems || problems.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid problems found in the uploaded file."
      });
    }

    // Check for duplicates before insertion
    const titles = problems.map(p => p.title);
    const slugs = titles.map(title => generateSlug(title));
    
    // Find existing problems with matching slugs
    const existingProblems = await Problem.find(
      { slug: { $in: slugs } },
      { slug: 1, title: 1 }
    );

    const existingSlugsSet = new Set(existingProblems.map(p => p.slug));
    
    // Separate new problems from duplicates
    const newProblems = [];
    const duplicates = [];
    
    problems.forEach((problem, index) => {
      const problemSlug = slugs[index];
      if (existingSlugsSet.has(problemSlug)) {
        duplicates.push({
          title: problem.title,
          reason: "Problem with this title already exists"
        });
      } else {
        newProblems.push({
          ...problem,
          createdBy: req.user.id,
          isActive: true
        });
      }
    });

    // Bulk insert new problems
    const results = {
      success: [],
      failed: [],
      duplicates: duplicates
    };

    if (newProblems.length > 0) {
      try {
        // Use insertMany with ordered: false to continue on errors
        const insertedProblems = await Problem.insertMany(newProblems, { 
          ordered: false,
          rawResult: true 
        });
        
        results.success = insertedProblems.insertedIds 
          ? Object.values(insertedProblems.insertedIds).length 
          : newProblems.length;
      } catch (bulkError) {
        // Handle partial insertion errors
        if (bulkError.writeErrors) {
          bulkError.writeErrors.forEach((err) => {
            const failedProblem = newProblems[err.index];
            results.failed.push({
              title: failedProblem.title,
              reason: err.errmsg || "Unknown error"
            });
          });
          // Calculate successful insertions
          results.success = newProblems.length - bulkError.writeErrors.length;
        } else {
          throw bulkError;
        }
      }
    }

    // Clean up uploaded file
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Prepare response
    const totalProcessed = problems.length;
    const successCount = typeof results.success === 'number' ? results.success : results.success.length;
    
    res.status(200).json({
      success: true,
      message: `Bulk upload completed. ${successCount} problems added successfully.`,
      summary: {
        totalProcessed,
        successful: successCount,
        duplicates: results.duplicates.length,
        failed: results.failed.length
      },
      details: {
        duplicates: results.duplicates.slice(0, 20), // Limit to first 20
        failed: results.failed.slice(0, 20) // Limit to first 20
      }
    });

  } catch (error) {
    console.error("Bulk upload error:", error);
    
    // Clean up file on error
    if (filePath && fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (cleanupError) {
        console.error("File cleanup error:", cleanupError);
      }
    }

    res.status(500).json({
      success: false,
      message: "Error processing bulk upload",
      error: error.message
    });
  }
};

/**
 * Helper function to parse CSV file
 */
async function parseCSVFile(filePath) {
  return new Promise((resolve, reject) => {
    const problems = [];
    
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => {
        try {
          // Parse CSV row into problem object
          const problem = {
            title: row.title?.trim(),
            description: row.description?.trim(),
            difficulty: row.difficulty?.trim() || 'Medium',
            topics: row.topics ? row.topics.split(',').map(t => t.trim()).filter(Boolean) : [],
            companies: row.companies ? row.companies.split(',').map(c => c.trim()).filter(Boolean) : [],
            constraints: row.constraints?.trim() || '',
            inputFormat: row.inputFormat?.trim() || '',
            outputFormat: row.outputFormat?.trim() || '',
            hints: row.hints ? row.hints.split('|').map(h => h.trim()).filter(Boolean) : []
          };

          // Parse sample test cases if provided
          const sampleTestCases = [];
          let i = 1;
          while (row[`sampleInput${i}`] || row[`sampleOutput${i}`]) {
            if (row[`sampleInput${i}`] && row[`sampleOutput${i}`]) {
              sampleTestCases.push({
                input: row[`sampleInput${i}`].trim(),
                output: row[`sampleOutput${i}`].trim(),
                isHidden: false
              });
            }
            i++;
          }
          
          if (sampleTestCases.length > 0) {
            problem.sampleTestCases = sampleTestCases;
          }

          // Validate required fields
          if (problem.title && problem.description && problem.topics.length > 0) {
            problems.push(problem);
          }
        } catch (error) {
          console.error('Error parsing CSV row:', error);
        }
      })
      .on('end', () => {
        resolve(problems);
      })
      .on('error', (error) => {
        reject(error);
      });
  });
}

/**
 * Helper function to parse JSON file
 */
async function parseJSONFile(filePath) {
  try {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(fileContent);
    
    // Support both array format and {problems: []} format
    const problemsArray = Array.isArray(data) ? data : data.problems;
    
    if (!Array.isArray(problemsArray)) {
      throw new Error('Invalid JSON format. Expected an array of problems or {problems: [...]}');
    }

    // Validate and normalize each problem
    return problemsArray
      .filter(p => p.title && p.description && p.topics && p.topics.length > 0)
      .map(p => ({
        title: p.title.trim(),
        description: p.description.trim(),
        difficulty: p.difficulty || 'Medium',
        topics: Array.isArray(p.topics) ? p.topics : [],
        companies: Array.isArray(p.companies) ? p.companies : [],
        constraints: p.constraints || '',
        inputFormat: p.inputFormat || '',
        outputFormat: p.outputFormat || '',
        hints: Array.isArray(p.hints) ? p.hints : [],
        sampleTestCases: Array.isArray(p.sampleTestCases) ? p.sampleTestCases : [],
        hiddenTestCases: Array.isArray(p.hiddenTestCases) ? p.hiddenTestCases : [],
        starterCode: p.starterCode || {},
        solution: p.solution || {}
      }));
  } catch (error) {
    throw new Error(`Error parsing JSON file: ${error.message}`);
  }
}

/**
 * Helper function to generate slug from title
 */
function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}
