const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  getAllContests,
  getContestDetails,
  registerForContest,
  startContest,
  submitContestSolution,
  getContestLeaderboard,
  getMySubmissions
} = require('../controllers/contestController');

// Public routes
router.get('/', getAllContests);
router.get('/:slug', getContestDetails);
router.get('/:slug/leaderboard', getContestLeaderboard);

// Protected routes
router.post('/:slug/register', auth, registerForContest);
router.post('/:slug/start', auth, startContest);
router.post('/:slug/submit', auth, submitContestSolution);
router.get('/:slug/my-submissions', auth, getMySubmissions);

module.exports = router;
