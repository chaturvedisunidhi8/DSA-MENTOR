const Interview = require("../models/Interview");
const Problem = require("../models/Problem");
const {
  runTestCases,
  ExecutionConfigError,
  ExecutionServiceError,
} = require("../utils/executionClient");
const {
  generateAIResponse,
  generateSolutionFeedback,
  generateInterviewSummary,
  isConfigured: isAIConfigured
} = require("../utils/aiService");

// Create new interview session
exports.createInterview = async (req, res) => {
  try {
    const { difficulty, topics, duration, questionCount, interviewType } = req.body;
    const userId = req.user._id;

    // Build query for problems
    const query = { isActive: true };
    
    if (difficulty !== "mixed") {
      query.difficulty = difficulty;
    }
    
    if (topics && topics.length > 0) {
      query.topics = { $in: topics };
    }

    // Fetch problems
    let problems = await Problem.find(query).limit(questionCount * 3);
    
    if (problems.length < questionCount) {
      return res.status(400).json({
        success: false,
        message: "Not enough problems available for the selected criteria",
      });
    }

    // Randomly select questions
    const selectedProblems = [];
    const usedIndices = new Set();
    
    while (selectedProblems.length < questionCount && usedIndices.size < problems.length) {
      const randomIndex = Math.floor(Math.random() * problems.length);
      if (!usedIndices.has(randomIndex)) {
        usedIndices.add(randomIndex);
        selectedProblems.push(problems[randomIndex]._id);
      }
    }

    // Create interview session
    const interview = new Interview({
      userId,
      interviewType,
      difficulty,
      topics,
      duration,
      questionCount,
      questions: selectedProblems,
      status: "in-progress",
      startedAt: new Date(),
      timeRemaining: duration * 60, // convert to seconds
      responses: selectedProblems.map((q) => ({ questionId: q })),
    });

    await interview.save();

    res.status(201).json({
      success: true,
      message: "Interview session created successfully",
      sessionId: interview._id,
    });
  } catch (error) {
    console.error("Create interview error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create interview session",
    });
  }
};

// Get interview session
exports.getSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user._id;

    const interview = await Interview.findOne({
      _id: sessionId,
      userId,
    }).populate("questions");

    if (!interview) {
      return res.status(404).json({
        success: false,
        message: "Interview session not found",
      });
    }

    // Format current question
    const currentQuestion = interview.questions[interview.currentQuestionIndex];
    const formattedQuestion = {
      title: currentQuestion.title,
      description: currentQuestion.description,
      difficulty: currentQuestion.difficulty,
      topics: currentQuestion.topics,
      examples: currentQuestion.sampleTestCases?.slice(0, 2).map((tc) => ({
        input: tc.input,
        output: tc.output,
        explanation: tc.explanation,
      })),
      starterCode: currentQuestion.starterCode,
    };

    res.json({
      success: true,
      session: {
        _id: interview._id,
        duration: interview.duration,
        timeRemaining: interview.timeRemaining,
        currentQuestionIndex: interview.currentQuestionIndex,
        totalQuestions: interview.questions.length,
        messages: interview.messages,
        currentQuestion: formattedQuestion,
        questions: interview.questions.map((q) => ({
          title: q.title,
          difficulty: q.difficulty,
          topics: q.topics,
        })),
      },
    });
  } catch (error) {
    console.error("Get session error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch interview session",
    });
  }
};

// Send message to AI
exports.sendMessage = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { message, code } = req.body;
    const userId = req.user._id;

    const interview = await Interview.findOne({
      _id: sessionId,
      userId,
    }).populate('questions');

    if (!interview) {
      return res.status(404).json({
        success: false,
        message: "Interview session not found",
      });
    }

    // Add user message
    interview.messages.push({
      role: "user",
      content: message,
    });

    // Get current problem for context
    const currentProblem = interview.questions[interview.currentQuestionIndex];

    // Build context for AI
    const context = {
      problem: currentProblem,
      interviewType: interview.interviewType,
      conversationHistory: interview.messages.slice(-10) // Last 10 messages for context
    };

    // Generate AI response using the real AI service
    const aiResponse = await generateAIResponse(context, message, code);

    // Add AI response
    interview.messages.push({
      role: "ai",
      content: aiResponse,
    });

    await interview.save();

    res.json({
      success: true,
      response: aiResponse,
    });
  } catch (error) {
    console.error("Send message error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send message",
    });
  }
};

const buildExecutionPayload = (executionResults, hideHiddenInputs) =>
  executionResults.results.map((r) => ({
    index: r.index,
    passed: r.passed,
    isHidden: r.isHidden,
    stdout: r.stdout,
    stderr: r.stderr,
    timeMs: r.timeMs,
    input: r.isHidden && hideHiddenInputs ? undefined : r.input,
    expectedOutput: r.isHidden && hideHiddenInputs ? undefined : r.expectedOutput,
  }));

// Run code
exports.runCode = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { code, language } = req.body;
    const userId = req.user._id;

    const interview = await Interview.findOne({
      _id: sessionId,
      userId,
    }).populate("questions");

    if (!interview) {
      return res.status(404).json({
        success: false,
        message: "Interview session not found",
      });
    }

    const currentProblem = interview.questions[interview.currentQuestionIndex];
    const sampleTests = currentProblem.sampleTestCases?.length
      ? currentProblem.sampleTestCases
      : currentProblem.hiddenTestCases;

    if (!sampleTests || sampleTests.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No test cases configured for this question",
      });
    }

    const execution = await runTestCases({ code, language, testCases: sampleTests });

    res.json({
      success: execution.passedCount === execution.totalTests,
      passedTests: execution.passedCount,
      totalTests: execution.totalTests,
      results: buildExecutionPayload(execution, true),
    });
  } catch (error) {
    if (error instanceof ExecutionConfigError || error instanceof ExecutionServiceError) {
      return res.status(error.status || 500).json({ success: false, message: error.message });
    }
    console.error("Run code error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to run code",
    });
  }
};

// Submit solution
exports.submitSolution = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { code, language, questionIndex } = req.body;
    const userId = req.user._id;

    const interview = await Interview.findOne({
      _id: sessionId,
      userId,
    }).populate("questions");

    if (!interview) {
      return res.status(404).json({
        success: false,
        message: "Interview session not found",
      });
    }

    const currentProblem = interview.questions[questionIndex];

    const testCases = [
      ...(currentProblem.sampleTestCases || []),
      ...(currentProblem.hiddenTestCases || []),
    ];

    if (testCases.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No test cases configured for this question",
      });
    }

    const execution = await runTestCases({ code, language, testCases });
    const testResults = {
      passedTests: execution.passedCount,
      totalTests: execution.totalTests,
      success: execution.passedCount === execution.totalTests,
    };
    const feedback = await generateSolutionFeedback(code, language, currentProblem, testResults);

    // Update response
    interview.responses[questionIndex] = {
      ...interview.responses[questionIndex].toObject(),
      code,
      language,
      submitted: true,
      score: feedback.score,
      feedback: feedback.feedback,
      strengths: feedback.strengths,
      improvements: feedback.improvements,
      timeComplexity: feedback.timeComplexity,
      spaceComplexity: feedback.spaceComplexity,
    };

    // Check if there's a next question
    const hasNextQuestion = questionIndex + 1 < interview.questions.length;
    
    if (hasNextQuestion) {
      interview.currentQuestionIndex = questionIndex + 1;
      const nextQuestion = interview.questions[questionIndex + 1];
      
      await interview.save();

      res.json({
        success: true,
        feedback: feedback.feedback,
        hasNextQuestion: true,
        passedTests: execution.passedCount,
        totalTests: execution.totalTests,
        results: buildExecutionPayload(execution, true),
        nextQuestionIndex: questionIndex + 1,
        nextQuestion: {
          title: nextQuestion.title,
          description: nextQuestion.description,
          difficulty: nextQuestion.difficulty,
          topics: nextQuestion.topics,
          starterCode: nextQuestion.starterCode,
        },
      });
    } else {
      await interview.save();
      
      res.json({
        success: true,
        feedback: "Great job completing all questions! Let's review your performance.",
        passedTests: execution.passedCount,
        totalTests: execution.totalTests,
        results: buildExecutionPayload(execution, true),
        hasNextQuestion: false,
      });
    }
  } catch (error) {
    if (error instanceof ExecutionConfigError || error instanceof ExecutionServiceError) {
      return res.status(error.status || 500).json({ success: false, message: error.message });
    }
    console.error("Submit solution error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to submit solution",
    });
  }
};

// Request hint
exports.requestHint = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { code } = req.body;
    const userId = req.user._id;

    const interview = await Interview.findOne({
      _id: sessionId,
      userId,
    }).populate("questions");

    if (!interview) {
      return res.status(404).json({
        success: false,
        message: "Interview session not found",
      });
    }

    // Increment hint counter
    interview.totalHintsUsed += 1;
    interview.responses[interview.currentQuestionIndex].hintsUsed += 1;

    const currentProblem = interview.questions[interview.currentQuestionIndex];
    
    // Generate hint (placeholder)
    const hints = currentProblem.hints || [
      "Start by understanding the problem constraints.",
      "Consider using a hash map for O(1) lookups.",
      "Think about edge cases like empty arrays or single elements.",
    ];
    
    const hintIndex = Math.min(
      interview.responses[interview.currentQuestionIndex].hintsUsed - 1,
      hints.length - 1
    );

    await interview.save();

    res.json({
      success: true,
      hint: hints[hintIndex],
    });
  } catch (error) {
    console.error("Request hint error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get hint",
    });
  }
};

// End interview
exports.endInterview = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user._id;

    const interview = await Interview.findOne({
      _id: sessionId,
      userId,
    });

    if (!interview) {
      return res.status(404).json({
        success: false,
        message: "Interview session not found",
      });
    }

    interview.status = "completed";
    interview.completedAt = new Date();
    
    // Calculate scores and generate feedback
    interview.calculateScores();
    interview.generateSummary();
    interview.generateRecommendations();
    
    // Generate detailed AI feedback using the AI service
    try {
      interview.detailedFeedback = await generateInterviewSummary(interview);
    } catch (error) {
      console.error('Error generating AI summary:', error);
      interview.detailedFeedback = `Based on your performance, you demonstrated ${
        interview.overallScore >= 80 ? "strong" : interview.overallScore >= 60 ? "adequate" : "developing"
      } problem-solving abilities. Your code quality and communication could be enhanced with more practice. Focus on the areas highlighted in the recommendations to improve your interview performance.`;
    }

    await interview.save();

    // Check and unlock achievements after completing interview
    const { checkAndUnlockAchievements } = require('./achievementController');
    checkAndUnlockAchievements(userId).catch(err => {
      console.error('Error checking achievements:', err);
    });

    res.json({
      success: true,
      message: "Interview completed successfully",
    });
  } catch (error) {
    console.error("End interview error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to end interview",
    });
  }
};

// Get interview results
exports.getResults = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user._id;

    const interview = await Interview.findOne({
      _id: sessionId,
      userId,
    }).populate("questions");

    if (!interview) {
      return res.status(404).json({
        success: false,
        message: "Interview results not found",
      });
    }

    const results = {
      overallScore: interview.overallScore,
      problemSolvingScore: interview.problemSolvingScore,
      codeQualityScore: interview.codeQualityScore,
      communicationScore: interview.communicationScore,
      timeManagementScore: interview.timeManagementScore,
      accuracy: interview.accuracy,
      questionsCompleted: interview.questionsCompleted,
      totalQuestions: interview.questions.length,
      timeSpent: `${interview.timeSpent}m`,
      hintsUsed: interview.totalHintsUsed,
      summary: interview.summary,
      detailedFeedback: interview.detailedFeedback,
      recommendations: interview.recommendations,
      questions: interview.questions.map((q, idx) => ({
        title: q.title,
        difficulty: q.difficulty,
        score: interview.responses[idx]?.score || 0,
        feedback: interview.responses[idx]?.feedback || "Not attempted",
        strengths: interview.responses[idx]?.strengths || [],
        improvements: interview.responses[idx]?.improvements || [],
        timeComplexity: interview.responses[idx]?.timeComplexity,
        spaceComplexity: interview.responses[idx]?.spaceComplexity,
      })),
    };

    res.json({
      success: true,
      results,
    });
  } catch (error) {
    console.error("Get results error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch interview results",
    });
  }
};

// Get user's interview history
exports.getInterviewHistory = async (req, res) => {
  try {
    const userId = req.user._id;

    const interviews = await Interview.find({
      userId,
      status: "completed",
    })
      .sort({ completedAt: -1 })
      .limit(10)
      .select("overallScore difficulty topics completedAt questionsCompleted");

    res.json({
      success: true,
      interviews,
    });
  } catch (error) {
    console.error("Get interview history error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch interview history",
    });
  }
};

// Get interview statistics
exports.getInterviewStats = async (req, res) => {
  try {
    const userId = req.user._id;

    const interviews = await Interview.find({
      userId,
      status: "completed",
    });

    const stats = {
      totalInterviews: interviews.length,
      averageScore: interviews.length > 0
        ? Math.round(
            interviews.reduce((sum, i) => sum + (i.overallScore || 0), 0) / interviews.length
          )
        : 0,
      bestScore: interviews.length > 0
        ? Math.max(...interviews.map((i) => i.overallScore || 0))
        : 0,
      totalQuestionsAttempted: interviews.reduce(
        (sum, i) => sum + (i.questionsCompleted || 0),
        0
      ),
      topicDistribution: {},
    };

    // Calculate topic distribution
    interviews.forEach((interview) => {
      interview.topics.forEach((topic) => {
        stats.topicDistribution[topic] = (stats.topicDistribution[topic] || 0) + 1;
      });
    });

    res.json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error("Get interview stats error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch interview statistics",
    });
  }
};
