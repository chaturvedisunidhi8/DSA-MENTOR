const { Certification, CertificationAttempt } = require('../models/Certification');
const User = require('../models/User');
const Problem = require('../models/Problem');
const { runTestCases } = require('../utils/executionClient');
const crypto = require('crypto');

/**
 * Get all active certifications
 * @route GET /api/certifications
 */
exports.getAllCertifications = async (req, res) => {
  try {
    const { category, difficulty } = req.query;
    
    const filter = { isActive: true };
    if (category) filter.category = category;
    if (difficulty) filter.difficulty = difficulty;
    
    const certifications = await Certification.find(filter)
      .select('-problems.problemId') // Don't expose problem IDs before purchase
      .sort({ category: 1, difficulty: 1 })
      .lean();
    
    res.json({ certifications });
  } catch (error) {
    console.error('Error fetching certifications:', error);
    res.status(500).json({ message: 'Failed to fetch certifications', error: error.message });
  }
};

/**
 * Get single certification details
 * @route GET /api/certifications/:slug
 */
exports.getCertificationDetails = async (req, res) => {
  try {
    const { slug } = req.params;
    const userId = req.user?.userId;
    
    const certification = await Certification.findOne({ slug, isActive: true })
      .select('-problems.problemId') // Don't expose problems unless enrolled
      .lean();
    
    if (!certification) {
      return res.status(404).json({ message: 'Certification not found' });
    }
    
    // Check if user has purchased this certification
    let hasPurchased = false;
    let attempts = [];
    
    if (userId) {
      const userAttempts = await CertificationAttempt.find({
        userId,
        certificationId: certification._id,
        paymentStatus: 'paid'
      })
      .select('attemptNumber status percentage passed completedAt')
      .sort({ attemptNumber: -1 })
      .lean();
      
      hasPurchased = userAttempts.length > 0;
      attempts = userAttempts;
    }
    
    // If purchased, include problem details
    if (hasPurchased) {
      const fullCertification = await Certification.findOne({ slug })
        .populate('problems.problemId', 'title slug difficulty topic')
        .lean();
      
      return res.json({
        certification: fullCertification,
        hasPurchased: true,
        attempts
      });
    }
    
    res.json({
      certification,
      hasPurchased: false,
      attempts: []
    });
  } catch (error) {
    console.error('Error fetching certification details:', error);
    res.status(500).json({ message: 'Failed to fetch certification', error: error.message });
  }
};

/**
 * Purchase/Enroll in certification
 * @route POST /api/certifications/:slug/purchase
 */
exports.purchaseCertification = async (req, res) => {
  try {
    const { slug } = req.params;
    const userId = req.user.userId;
    const { paymentId, paymentAmount } = req.body;
    
    const certification = await Certification.findOne({ slug, isActive: true });
    
    if (!certification) {
      return res.status(404).json({ message: 'Certification not found' });
    }
    
    // Verify payment amount matches
    if (paymentAmount !== certification.price) {
      return res.status(400).json({ message: 'Payment amount mismatch' });
    }
    
    // Check if already purchased
    const existingPurchase = await CertificationAttempt.findOne({
      userId,
      certificationId: certification._id,
      paymentStatus: 'paid'
    });
    
    if (existingPurchase) {
      return res.status(400).json({ message: 'Already purchased this certification' });
    }
    
    // Calculate max possible score
    const maxPossibleScore = certification.problems.reduce((sum, p) => sum + p.points, 0);
    
    // Create initial attempt
    const attempt = await CertificationAttempt.create({
      userId,
      certificationId: certification._id,
      attemptNumber: 1,
      status: 'pending',
      maxPossibleScore,
      paymentStatus: 'paid',
      paymentId,
      paymentAmount
    });
    
    // Update certification enrollment count
    certification.enrollmentCount += 1;
    await certification.save();
    
    res.json({
      message: 'Successfully purchased certification',
      attemptId: attempt._id,
      certification: {
        _id: certification._id,
        title: certification.title,
        slug: certification.slug
      }
    });
  } catch (error) {
    console.error('Error purchasing certification:', error);
    res.status(500).json({ message: 'Failed to purchase certification', error: error.message });
  }
};

/**
 * Start certification exam
 * @route POST /api/certifications/:slug/start
 */
exports.startCertification = async (req, res) => {
  try {
    const { slug } = req.params;
    const userId = req.user.userId;
    
    const certification = await Certification.findOne({ slug, isActive: true })
      .populate('problems.problemId');
    
    if (!certification) {
      return res.status(404).json({ message: 'Certification not found' });
    }
    
    // Find the user's most recent attempt
    const attempt = await CertificationAttempt.findOne({
      userId,
      certificationId: certification._id,
      paymentStatus: 'paid',
      status: 'pending'
    }).sort({ createdAt: -1 });
    
    if (!attempt) {
      return res.status(403).json({ message: 'No valid attempt found. Please purchase first.' });
    }
    
    // Start the attempt
    attempt.status = 'in-progress';
    attempt.startedAt = new Date();
    await attempt.save();
    
    // Return problems without solutions
    const problems = certification.problems.map(p => ({
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
      points: p.points
    }));
    
    res.json({
      attemptId: attempt._id,
      duration: certification.duration,
      startedAt: attempt.startedAt,
      expiresAt: new Date(attempt.startedAt.getTime() + certification.duration * 60000),
      problems
    });
  } catch (error) {
    console.error('Error starting certification:', error);
    res.status(500).json({ message: 'Failed to start certification', error: error.message });
  }
};

/**
 * Submit solution for a problem in certification
 * @route POST /api/certifications/attempt/:attemptId/submit
 */
exports.submitCertificationProblem = async (req, res) => {
  try {
    const { attemptId } = req.params;
    const userId = req.user.userId;
    const { problemId, code, language } = req.body;
    
    const attempt = await CertificationAttempt.findOne({
      _id: attemptId,
      userId,
      status: 'in-progress'
    }).populate('certificationId');
    
    if (!attempt) {
      return res.status(404).json({ message: 'Attempt not found or not in progress' });
    }
    
    // Check if time limit exceeded
    const certification = attempt.certificationId;
    const timeLimit = certification.duration * 60000; // Convert to milliseconds
    const timeElapsed = Date.now() - attempt.startedAt.getTime();
    
    if (timeElapsed > timeLimit) {
      attempt.status = 'failed';
      await attempt.save();
      return res.status(400).json({ message: 'Time limit exceeded' });
    }
    
    // Get problem details
    const problem = await Problem.findById(problemId);
    if (!problem) {
      return res.status(404).json({ message: 'Problem not found' });
    }
    
    // Find the problem's points in certification
    const certProblem = certification.problems.find(p => p.problemId.toString() === problemId);
    if (!certProblem) {
      return res.status(400).json({ message: 'Problem not part of this certification' });
    }
    
    // Execute code against test cases
    const execution = await runTestCases({
      code,
      language,
      testCases: problem.testCases
    });
    
    // Calculate score
    const percentage = (execution.passedCount / execution.totalTests) * 100;
    const score = Math.round((percentage / 100) * certProblem.points);
    
    // Update or add problem result
    const existingResultIndex = attempt.problemResults.findIndex(
      r => r.problemId.toString() === problemId
    );
    
    const problemResult = {
      problemId,
      code,
      language,
      score,
      maxScore: certProblem.points,
      testResults: {
        passed: execution.passedCount,
        total: execution.totalTests
      },
      submittedAt: new Date()
    };
    
    if (existingResultIndex >= 0) {
      // Update existing result (keep best score)
      if (score > attempt.problemResults[existingResultIndex].score) {
        attempt.problemResults[existingResultIndex] = problemResult;
      }
    } else {
      attempt.problemResults.push(problemResult);
    }
    
    // Recalculate total score
    attempt.totalScore = attempt.problemResults.reduce((sum, r) => sum + r.score, 0);
    attempt.percentage = Math.round((attempt.totalScore / attempt.maxPossibleScore) * 100);
    attempt.timeSpent = Math.floor((Date.now() - attempt.startedAt.getTime()) / 1000);
    
    await attempt.save();
    
    res.json({
      success: execution.passedCount === execution.totalTests,
      score,
      maxScore: certProblem.points,
      testResults: {
        passed: execution.passedCount,
        total: execution.totalTests
      },
      currentTotalScore: attempt.totalScore,
      currentPercentage: attempt.percentage
    });
  } catch (error) {
    console.error('Error submitting certification problem:', error);
    res.status(500).json({ message: 'Failed to submit solution', error: error.message });
  }
};

/**
 * Complete certification exam
 * @route POST /api/certifications/attempt/:attemptId/complete
 */
exports.completeCertification = async (req, res) => {
  try {
    const { attemptId } = req.params;
    const userId = req.user.userId;
    
    const attempt = await CertificationAttempt.findOne({
      _id: attemptId,
      userId,
      status: 'in-progress'
    }).populate('certificationId');
    
    if (!attempt) {
      return res.status(404).json({ message: 'Attempt not found or not in progress' });
    }
    
    const certification = attempt.certificationId;
    
    // Calculate final scores
    attempt.completedAt = new Date();
    attempt.timeSpent = Math.floor((attempt.completedAt - attempt.startedAt) / 1000);
    attempt.passed = attempt.percentage >= certification.passingScore;
    attempt.status = attempt.passed ? 'completed' : 'failed';
    
    // Generate certificate if passed
    if (attempt.passed) {
      attempt.certificateId = `CERT-${certification.slug.toUpperCase()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
      attempt.certificateUrl = `/api/certifications/certificate/${attempt.certificateId}`;
      
      // Update certification stats
      certification.completionCount += 1;
      const totalScore = (certification.averageScore * (certification.completionCount - 1) + attempt.percentage) / certification.completionCount;
      certification.averageScore = Math.round(totalScore * 10) / 10;
      await certification.save();
      
      // Add to user's recent activity
      const user = await User.findById(userId);
      if (user) {
        user.recentActivity.unshift({
          type: 'earned_achievement',
          achievementId: `certification_${certification.slug}`,
          details: `Earned ${certification.title} certification`,
          timestamp: new Date()
        });
        if (user.recentActivity.length > 50) {
          user.recentActivity = user.recentActivity.slice(0, 50);
        }
        await user.save();
      }
    }
    
    await attempt.save();
    
    res.json({
      passed: attempt.passed,
      percentage: attempt.percentage,
      totalScore: attempt.totalScore,
      maxPossibleScore: attempt.maxPossibleScore,
      timeSpent: attempt.timeSpent,
      certificateId: attempt.certificateId,
      certificateUrl: attempt.certificateUrl,
      problemResults: attempt.problemResults.map(r => ({
        problemId: r.problemId,
        score: r.score,
        maxScore: r.maxScore,
        testResults: r.testResults
      }))
    });
  } catch (error) {
    console.error('Error completing certification:', error);
    res.status(500).json({ message: 'Failed to complete certification', error: error.message });
  }
};

/**
 * Get user's certification attempts
 * @route GET /api/certifications/my-attempts
 */
exports.getMyCertifications = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const attempts = await CertificationAttempt.find({ userId })
      .populate('certificationId', 'title slug category difficulty price badgeImage')
      .sort({ createdAt: -1 })
      .lean();
    
    res.json({ attempts });
  } catch (error) {
    console.error('Error fetching user certifications:', error);
    res.status(500).json({ message: 'Failed to fetch certifications', error: error.message });
  }
};

/**
 * Get certificate by ID (for verification and download)
 * @route GET /api/certifications/certificate/:certificateId
 */
exports.getCertificate = async (req, res) => {
  try {
    const { certificateId } = req.params;
    
    const attempt = await CertificationAttempt.findOne({ certificateId })
      .populate('userId', 'fullName username email')
      .populate('certificationId', 'title category difficulty skills')
      .lean();
    
    if (!attempt || !attempt.passed) {
      return res.status(404).json({ message: 'Certificate not found' });
    }
    
    res.json({
      certificate: {
        id: attempt.certificateId,
        recipientName: attempt.userId.fullName || attempt.userId.username,
        recipientEmail: attempt.userId.email,
        certificationTitle: attempt.certificationId.title,
        category: attempt.certificationId.category,
        difficulty: attempt.certificationId.difficulty,
        skills: attempt.certificationId.skills,
        score: attempt.percentage,
        issuedDate: attempt.completedAt,
        verificationUrl: `${req.protocol}://${req.get('host')}/api/certifications/certificate/${attempt.certificateId}`
      }
    });
  } catch (error) {
    console.error('Error fetching certificate:', error);
    res.status(500).json({ message: 'Failed to fetch certificate', error: error.message });
  }
};

module.exports = exports;
