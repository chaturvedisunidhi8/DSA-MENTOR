const { Contest, ContestParticipant } = require('../models/Contest');
const Problem = require('../models/Problem');
const User = require('../models/User');
const { runTestCases } = require('../utils/executionClient');

/**
 * Get all contests with filters
 * @route GET /api/contests
 */
exports.getAllContests = async (req, res) => {
  try {
    const { status, type } = req.query;
    
    const filter = { isPublic: true };
    if (status) filter.status = status;
    if (type) filter.type = type;
    
    const contests = await Contest.find(filter)
      .select('-problems.problemId') // Don't expose problems before contest
      .sort({ startTime: -1 })
      .lean();
    
    // Update status based on current time
    const now = new Date();
    for (let contest of contests) {
      if (contest.status === 'upcoming' && now >= contest.startTime) {
        contest.status = 'live';
      } else if (contest.status === 'live' && now >= contest.endTime) {
        contest.status = 'completed';
      }
    }
    
    res.json({ contests });
  } catch (error) {
    console.error('Error fetching contests:', error);
    res.status(500).json({ message: 'Failed to fetch contests', error: error.message });
  }
};

/**
 * Get contest details
 * @route GET /api/contests/:slug
 */
exports.getContestDetails = async (req, res) => {
  try {
    const { slug } = req.params;
    const userId = req.user?.userId;
    
    const contest = await Contest.findOne({ slug, isPublic: true }).lean();
    
    if (!contest) {
      return res.status(404).json({ message: 'Contest not found' });
    }
    
    // Update status
    const now = new Date();
    if (contest.status === 'upcoming' && now >= contest.startTime) {
      contest.status = 'live';
      await Contest.updateOne({ _id: contest._id }, { status: 'live' });
    } else if (contest.status === 'live' && now >= contest.endTime) {
      contest.status = 'completed';
      await Contest.updateOne({ _id: contest._id }, { status: 'completed' });
    }
    
    // Check if user is registered
    let isRegistered = false;
    let participation = null;
    
    if (userId) {
      participation = await ContestParticipant.findOne({
        contestId: contest._id,
        userId
      }).lean();
      isRegistered = !!participation;
    }
    
    // If contest is live or user is registered, show problems
    if (contest.status === 'live' || contest.status === 'completed' || isRegistered) {
      const fullContest = await Contest.findOne({ slug })
        .populate('problems.problemId', 'title slug difficulty topic')
        .lean();
      
      return res.json({
        contest: fullContest,
        isRegistered,
        participation
      });
    }
    
    res.json({
      contest,
      isRegistered,
      participation: null
    });
  } catch (error) {
    console.error('Error fetching contest details:', error);
    res.status(500).json({ message: 'Failed to fetch contest', error: error.message });
  }
};

/**
 * Register for contest
 * @route POST /api/contests/:slug/register
 */
exports.registerForContest = async (req, res) => {
  try {
    const { slug } = req.params;
    const userId = req.user.userId;
    
    const contest = await Contest.findOne({ slug, isPublic: true });
    
    if (!contest) {
      return res.status(404).json({ message: 'Contest not found' });
    }
    
    if (contest.status !== 'upcoming' && contest.status !== 'live') {
      return res.status(400).json({ message: 'Registration is closed for this contest' });
    }
    
    if (contest.maxParticipants && contest.participantCount >= contest.maxParticipants) {
      return res.status(400).json({ message: 'Contest is full' });
    }
    
    // Check if already registered
    const existing = await ContestParticipant.findOne({
      contestId: contest._id,
      userId
    });
    
    if (existing) {
      return res.status(400).json({ message: 'Already registered for this contest' });
    }
    
    // Register participant
    const participant = await ContestParticipant.create({
      userId,
      contestId: contest._id
    });
    
    // Update participant count
    contest.participantCount += 1;
    await contest.save();
    
    res.json({
      message: 'Successfully registered for contest',
      participantId: participant._id
    });
  } catch (error) {
    console.error('Error registering for contest:', error);
    res.status(500).json({ message: 'Failed to register', error: error.message });
  }
};

/**
 * Start contest participation
 * @route POST /api/contests/:slug/start
 */
exports.startContest = async (req, res) => {
  try {
    const { slug } = req.params;
    const userId = req.user.userId;
    
    const contest = await Contest.findOne({ slug, isPublic: true })
      .populate('problems.problemId');
    
    if (!contest) {
      return res.status(404).json({ message: 'Contest not found' });
    }
    
    if (contest.status !== 'live') {
      return res.status(400).json({ message: 'Contest is not currently live' });
    }
    
    const participant = await ContestParticipant.findOne({
      contestId: contest._id,
      userId
    });
    
    if (!participant) {
      return res.status(403).json({ message: 'Not registered for this contest' });
    }
    
    if (!participant.startedAt) {
      participant.startedAt = new Date();
      await participant.save();
    }
    
    // Return problems without solutions
    const problems = contest.problems
      .sort((a, b) => a.order - b.order)
      .map(p => ({
        _id: p.problemId._id,
        title: p.problemId.title,
        slug: p.problemId.slug,
        difficulty: p.problemId.difficulty,
        topic: p.problemId.topic,
        description: p.problemId.description,
        examples: p.problemId.examples,
        constraints: p.problemId.constraints,
        testCases: p.problemId.testCases.filter(tc => !tc.isHidden).map(tc => ({
          input: tc.input,
          output: tc.output
        })),
        order: p.order,
        points: p.points
      }));
    
    res.json({
      contest: {
        title: contest.title,
        duration: contest.duration,
        startTime: contest.startTime,
        endTime: contest.endTime
      },
      problems,
      startedAt: participant.startedAt
    });
  } catch (error) {
    console.error('Error starting contest:', error);
    res.status(500).json({ message: 'Failed to start contest', error: error.message });
  }
};

/**
 * Submit solution in contest
 * @route POST /api/contests/:slug/submit
 */
exports.submitContestSolution = async (req, res) => {
  try {
    const { slug } = req.params;
    const userId = req.user.userId;
    const { problemId, code, language } = req.body;
    
    const contest = await Contest.findOne({ slug, isPublic: true });
    
    if (!contest) {
      return res.status(404).json({ message: 'Contest not found' });
    }
    
    if (contest.status !== 'live') {
      return res.status(400).json({ message: 'Contest is not currently live' });
    }
    
    const participant = await ContestParticipant.findOne({
      contestId: contest._id,
      userId
    });
    
    if (!participant) {
      return res.status(403).json({ message: 'Not registered for this contest' });
    }
    
    if (!participant.startedAt) {
      return res.status(400).json({ message: 'Contest not started yet' });
    }
    
    // Get problem
    const problem = await Problem.findById(problemId);
    if (!problem) {
      return res.status(404).json({ message: 'Problem not found' });
    }
    
    // Check if problem is in contest
    const contestProblem = contest.problems.find(p => p.problemId.toString() === problemId);
    if (!contestProblem) {
      return res.status(400).json({ message: 'Problem not in this contest' });
    }
    
    // Calculate time taken from contest start
    const timeTaken = Math.floor((Date.now() - participant.startedAt.getTime()) / 1000);
    
    // Execute code
    const execution = await runTestCases({
      code,
      language,
      testCases: problem.testCases
    });
    
    const allPassed = execution.passedCount === execution.totalTests;
    const status = allPassed ? 'accepted' : 'wrong_answer';
    
    // Calculate penalty (wrong submissions add penalty time)
    let penalty = 0;
    if (!allPassed) {
      penalty = 10 * 60; // 10 minutes penalty per wrong submission
    }
    
    // Add submission
    participant.submissions.push({
      problemId,
      code,
      language,
      submittedAt: new Date(),
      status,
      testsPassed: execution.passedCount,
      totalTests: execution.totalTests,
      timeTaken,
      penalty
    });
    
    // If accepted and not already solved
    if (allPassed) {
      const alreadySolved = participant.solvedProblems.some(
        sp => sp.problemId.toString() === problemId
      );
      
      if (!alreadySolved) {
        // Count previous wrong attempts
        const attempts = participant.submissions.filter(
          s => s.problemId.toString() === problemId
        ).length;
        
        participant.solvedProblems.push({
          problemId,
          solvedAt: new Date(),
          attempts,
          timeTaken
        });
        
        // Update total score
        participant.totalScore += contestProblem.points;
        
        // Add penalty for wrong attempts
        participant.penalty += penalty;
      }
    } else {
      participant.penalty += penalty;
    }
    
    await participant.save();
    
    // Update leaderboard ranks
    await updateContestRanks(contest._id);
    
    res.json({
      success: allPassed,
      status,
      testResults: {
        passed: execution.passedCount,
        total: execution.totalTests
      },
      timeTaken,
      penalty,
      currentScore: participant.totalScore,
      problemsSolved: participant.solvedProblems.length
    });
  } catch (error) {
    console.error('Error submitting contest solution:', error);
    res.status(500).json({ message: 'Failed to submit solution', error: error.message });
  }
};

/**
 * Get contest leaderboard
 * @route GET /api/contests/:slug/leaderboard
 */
exports.getContestLeaderboard = async (req, res) => {
  try {
    const { slug } = req.params;
    const { page = 1, limit = 50 } = req.query;
    
    const contest = await Contest.findOne({ slug, isPublic: true });
    
    if (!contest) {
      return res.status(404).json({ message: 'Contest not found' });
    }
    
    // Get all participants sorted by score and penalty
    const participants = await ContestParticipant.find({ contestId: contest._id })
      .populate('userId', 'username fullName profilePicture')
      .sort({ totalScore: -1, penalty: 1, finishedAt: 1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean();
    
    const total = await ContestParticipant.countDocuments({ contestId: contest._id });
    
    // Format leaderboard
    const leaderboard = participants.map((p, index) => ({
      rank: (page - 1) * limit + index + 1,
      user: {
        _id: p.userId._id,
        username: p.userId.username,
        fullName: p.userId.fullName,
        profilePicture: p.userId.profilePicture
      },
      score: p.totalScore,
      problemsSolved: p.solvedProblems.length,
      penalty: p.penalty,
      finishedAt: p.finishedAt
    }));
    
    res.json({
      leaderboard,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ message: 'Failed to fetch leaderboard', error: error.message });
  }
};

/**
 * Get user's contest submissions
 * @route GET /api/contests/:slug/my-submissions
 */
exports.getMySubmissions = async (req, res) => {
  try {
    const { slug } = req.params;
    const userId = req.user.userId;
    
    const contest = await Contest.findOne({ slug, isPublic: true });
    
    if (!contest) {
      return res.status(404).json({ message: 'Contest not found' });
    }
    
    const participant = await ContestParticipant.findOne({
      contestId: contest._id,
      userId
    })
    .populate('submissions.problemId', 'title slug')
    .populate('solvedProblems.problemId', 'title slug')
    .lean();
    
    if (!participant) {
      return res.status(404).json({ message: 'Not participating in this contest' });
    }
    
    res.json({
      submissions: participant.submissions,
      solvedProblems: participant.solvedProblems,
      totalScore: participant.totalScore,
      rank: participant.rank,
      penalty: participant.penalty
    });
  } catch (error) {
    console.error('Error fetching submissions:', error);
    res.status(500).json({ message: 'Failed to fetch submissions', error: error.message });
  }
};

/**
 * Helper function to update contest ranks
 */
async function updateContestRanks(contestId) {
  try {
    const participants = await ContestParticipant.find({ contestId })
      .sort({ totalScore: -1, penalty: 1, finishedAt: 1 });
    
    for (let i = 0; i < participants.length; i++) {
      participants[i].rank = i + 1;
      await participants[i].save();
    }
  } catch (error) {
    console.error('Error updating ranks:', error);
  }
}

module.exports = exports;
