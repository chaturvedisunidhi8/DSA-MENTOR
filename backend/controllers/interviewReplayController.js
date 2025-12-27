const Interview = require('../models/Interview');
const { generateAIResponse } = require('../utils/aiService');

/**
 * Get interview replay data with timestamped analysis
 * @route GET /api/interview/replay/:interviewId
 */
exports.getInterviewReplay = async (req, res) => {
  try {
    const { interviewId } = req.params;
    const userId = req.user._id;

    const interview = await Interview.findById(interviewId)
      .populate('problems', 'title slug difficulty')
      .lean();

    if (!interview) {
      return res.status(404).json({
        success: false,
        message: 'Interview not found'
      });
    }

    // Verify ownership
    if (interview.userId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Build timeline from messages and responses
    const timeline = [];

    // Add interview start
    timeline.push({
      timestamp: interview.startedAt,
      type: 'start',
      message: 'Interview started',
      elapsed: 0
    });

    // Add messages with elapsed time
    interview.messages.forEach((msg, idx) => {
      const elapsed = msg.timestamp 
        ? Math.floor((new Date(msg.timestamp) - new Date(interview.startedAt)) / 1000)
        : 0;

      timeline.push({
        timestamp: msg.timestamp || interview.startedAt,
        type: msg.role === 'user' ? 'user_message' : 'ai_message',
        message: msg.content,
        elapsed,
        messageIndex: idx
      });
    });

    // Add code submissions
    interview.responses.forEach((response, idx) => {
      if (response.submittedAt) {
        const elapsed = Math.floor((new Date(response.submittedAt) - new Date(interview.startedAt)) / 1000);
        
        timeline.push({
          timestamp: response.submittedAt,
          type: 'code_submission',
          problemIndex: idx,
          problem: interview.problems[idx]?.title,
          language: response.language,
          passed: response.passed,
          score: response.score,
          elapsed
        });
      }
    });

    // Add hints
    if (interview.hintsUsed > 0) {
      // Hints are tracked in messages - find them
      interview.messages.forEach((msg, idx) => {
        if (msg.role === 'user' && msg.content.toLowerCase().includes('hint')) {
          const elapsed = msg.timestamp 
            ? Math.floor((new Date(msg.timestamp) - new Date(interview.startedAt)) / 1000)
            : 0;

          timeline.push({
            timestamp: msg.timestamp,
            type: 'hint_requested',
            elapsed
          });
        }
      });
    }

    // Add interview end
    if (interview.completedAt) {
      timeline.push({
        timestamp: interview.completedAt,
        type: 'end',
        message: 'Interview completed',
        elapsed: interview.timeSpent
      });
    }

    // Sort timeline by timestamp
    timeline.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    res.json({
      success: true,
      data: {
        interview: {
          _id: interview._id,
          interviewType: interview.interviewType,
          difficulty: interview.difficulty,
          topics: interview.topics,
          duration: interview.duration,
          timeSpent: interview.timeSpent,
          startedAt: interview.startedAt,
          completedAt: interview.completedAt,
          overallScore: interview.overallScore,
          questionsSolved: interview.questionsSolved
        },
        timeline,
        problems: interview.problems,
        responses: interview.responses,
        insights: {
          totalMessages: interview.messages.length,
          hintsUsed: interview.hintsUsed,
          avgTimePerProblem: interview.timeSpent / interview.problems.length,
          communicationScore: interview.communicationScore,
          codeQualityScore: interview.codeQualityScore
        }
      }
    });
  } catch (error) {
    console.error('Get replay error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch replay data',
      error: error.message
    });
  }
};

/**
 * Generate AI-powered replay analysis with timestamped insights
 * @route GET /api/interview/replay/:interviewId/analysis
 */
exports.generateReplayAnalysis = async (req, res) => {
  try {
    const { interviewId } = req.params;
    const userId = req.user._id;

    const interview = await Interview.findById(interviewId)
      .populate('problems', 'title difficulty')
      .lean();

    if (!interview) {
      return res.status(404).json({
        success: false,
        message: 'Interview not found'
      });
    }

    if (interview.userId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Build conversation context for AI
    const conversationContext = interview.messages.map(msg => {
      const elapsed = msg.timestamp 
        ? Math.floor((new Date(msg.timestamp) - new Date(interview.startedAt)) / 1000)
        : 0;
      const minutes = Math.floor(elapsed / 60);
      const seconds = elapsed % 60;
      const timeStr = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
      
      return `[${timeStr}] ${msg.role === 'user' ? 'Candidate' : 'Interviewer'}: ${msg.content}`;
    }).join('\n');

    // Generate AI analysis
    const analysisPrompt = `You are an expert interview coach analyzing a recorded technical interview. 

Interview Details:
- Type: ${interview.interviewType}
- Difficulty: ${interview.difficulty}
- Topics: ${interview.topics.join(', ')}
- Duration: ${interview.duration} minutes
- Time Spent: ${interview.timeSpent} seconds
- Score: ${interview.overallScore}/100
- Questions Solved: ${interview.questionsSolved}/${interview.problems.length}
- Hints Used: ${interview.hintsUsed}

Full Conversation Timeline:
${conversationContext}

Code Submissions:
${interview.responses.map((r, idx) => `
Problem ${idx + 1}: ${interview.problems[idx]?.title}
- Language: ${r.language}
- Passed: ${r.passed ? 'Yes' : 'No'}
- Score: ${r.score}/100
- Feedback: ${r.feedback || 'N/A'}
`).join('\n')}

Please provide a detailed timestamped analysis with the following:

1. **Critical Moments** (3-5 key timestamps where candidate showed confusion, breakthrough, or mistakes)
2. **Communication Pattern** (how candidate explained their thinking process)
3. **Problem-Solving Approach** (did they clarify requirements, consider edge cases, test their code?)
4. **Code Quality Observations** (naming, structure, complexity awareness)
5. **Areas for Improvement** (specific, actionable feedback with timestamps)
6. **Strengths to Leverage** (what they did well with examples)

Format each critical moment as: "[MM:SS] - Brief description of what happened and why it matters"

Be constructive, specific, and reference actual timestamps from the conversation.`;

    const aiAnalysis = await generateAIResponse(
      { role: 'user', content: analysisPrompt },
      [],
      'Technical Interview Coach',
      'conversational'
    );

    // Parse AI response into structured format
    const analysis = {
      rawAnalysis: aiAnalysis,
      generated: true,
      generatedAt: new Date()
    };

    // Store analysis in interview (optional - for caching)
    await Interview.findByIdAndUpdate(interviewId, {
      $set: { 'replayAnalysis': analysis }
    });

    res.json({
      success: true,
      data: analysis
    });
  } catch (error) {
    console.error('Generate analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate analysis',
      error: error.message
    });
  }
};

/**
 * Get list of user's completed interviews available for replay
 * @route GET /api/interview/replays
 */
exports.getAvailableReplays = async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 10 } = req.query;

    const interviews = await Interview.find({
      userId,
      completedAt: { $exists: true, $ne: null }
    })
      .select('interviewType difficulty topics startedAt completedAt timeSpent overallScore questionsSolved problems')
      .populate('problems', 'title difficulty')
      .sort({ completedAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .lean();

    const total = await Interview.countDocuments({
      userId,
      completedAt: { $exists: true, $ne: null }
    });

    res.json({
      success: true,
      data: interviews,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get replays error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch replays',
      error: error.message
    });
  }
};
