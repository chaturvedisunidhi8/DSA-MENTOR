const express = require('express');
const router = express.Router();
const {
  getDiscussionsByProblem,
  getDiscussion,
  createDiscussion,
  updateDiscussion,
  deleteDiscussion,
  voteDiscussion,
  addReply,
  updateReply,
  deleteReply,
  voteReply,
  markAsAccepted,
  flagDiscussion
} = require('../controllers/discussionController');
const { authenticate } = require('../middleware/auth');

// Get discussions for a problem (public)
router.get('/problem/:problemId', getDiscussionsByProblem);

// Get single discussion (public)
router.get('/:discussionId', getDiscussion);

// Create discussion (authenticated)
router.post('/', authenticate, createDiscussion);

// Update discussion (authenticated, author only)
router.put('/:discussionId', authenticate, updateDiscussion);

// Delete discussion (authenticated, author or admin)
router.delete('/:discussionId', authenticate, deleteDiscussion);

// Vote on discussion (authenticated)
router.post('/:discussionId/vote', authenticate, voteDiscussion);

// Mark as accepted solution (authenticated, problem creator or admin)
router.post('/:discussionId/accept', authenticate, markAsAccepted);

// Flag discussion (authenticated)
router.post('/:discussionId/flag', authenticate, flagDiscussion);

// Reply operations
router.post('/:discussionId/replies', authenticate, addReply);
router.put('/:discussionId/replies/:replyId', authenticate, updateReply);
router.delete('/:discussionId/replies/:replyId', authenticate, deleteReply);
router.post('/:discussionId/replies/:replyId/vote', authenticate, voteReply);

module.exports = router;
