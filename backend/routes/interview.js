const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/auth");
const interviewController = require("../controllers/interviewController");
const interviewReplayController = require("../controllers/interviewReplayController");

// All routes require authentication
router.use(authenticate);

// Create new interview session
router.post("/create", interviewController.createInterview);

// Get interview session details
router.get("/session/:sessionId", interviewController.getSession);

// Send message to AI interviewer
router.post("/session/:sessionId/message", interviewController.sendMessage);

// Run code against test cases
router.post("/session/:sessionId/run", interviewController.runCode);

// Submit solution for a question
router.post("/session/:sessionId/submit", interviewController.submitSolution);

// Request hint for current question
router.post("/session/:sessionId/hint", interviewController.requestHint);

// End interview session
router.post("/session/:sessionId/end", interviewController.endInterview);

// Get interview results
router.get("/results/:sessionId", interviewController.getResults);

// Get user's interview history
router.get("/history", interviewController.getInterviewHistory);

// Get interview statistics for user
router.get("/stats", interviewController.getInterviewStats);

// Interview Replay Features
router.get("/replays", interviewReplayController.getAvailableReplays);
router.get("/replay/:interviewId", interviewReplayController.getInterviewReplay);
router.get("/replay/:interviewId/analysis", interviewReplayController.generateReplayAnalysis);

module.exports = router;
