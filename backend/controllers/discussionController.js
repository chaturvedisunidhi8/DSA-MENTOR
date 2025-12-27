const Discussion = require('../models/Discussion');
const Problem = require('../models/Problem');
const User = require('../models/User');

// Get all discussions for a problem
exports.getDiscussionsByProblem = async (req, res) => {
  try {
    const { problemId } = req.params;
    const { type, sort = 'hot', page = 1, limit = 20 } = req.query;

    const query = { problemId };
    if (type) query.type = type;

    let sortOption = {};
    switch (sort) {
      case 'hot':
        // Hot score calculation is virtual, so we'll sort by combination
        sortOption = { isPinned: -1, 'votes.upvotes': -1, createdAt: -1 };
        break;
      case 'top':
        sortOption = { isPinned: -1, 'votes.upvotes': -1 };
        break;
      case 'new':
        sortOption = { isPinned: -1, createdAt: -1 };
        break;
      case 'trending':
        // Discussions from last 7 days with most activity
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        query.createdAt = { $gte: sevenDaysAgo };
        sortOption = { 'votes.upvotes': -1, replies: -1 };
        break;
      default:
        sortOption = { isPinned: -1, createdAt: -1 };
    }

    const discussions = await Discussion.find(query)
      .populate('userId', 'username profilePicture')
      .populate('replies.userId', 'username profilePicture')
      .sort(sortOption)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    // Add user vote info if authenticated
    const userId = req.user?._id;
    if (userId) {
      discussions.forEach(discussion => {
        const disc = new Discussion(discussion);
        discussion.userVote = disc.getUserVote(userId);
      });
    }

    const count = await Discussion.countDocuments(query);

    res.json({
      success: true,
      discussions,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      total: count
    });
  } catch (error) {
    console.error('Error fetching discussions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch discussions',
      error: error.message
    });
  }
};

// Get single discussion
exports.getDiscussion = async (req, res) => {
  try {
    const { discussionId } = req.params;

    const discussion = await Discussion.findById(discussionId)
      .populate('userId', 'username profilePicture badges')
      .populate('replies.userId', 'username profilePicture badges')
      .lean();

    if (!discussion) {
      return res.status(404).json({
        success: false,
        message: 'Discussion not found'
      });
    }

    // Increment view count
    await Discussion.findByIdAndUpdate(discussionId, { $inc: { views: 1 } });

    // Add user vote info if authenticated
    if (req.user) {
      const disc = new Discussion(discussion);
      discussion.userVote = disc.getUserVote(req.user._id);
    }

    res.json({
      success: true,
      discussion
    });
  } catch (error) {
    console.error('Error fetching discussion:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch discussion',
      error: error.message
    });
  }
};

// Create new discussion
exports.createDiscussion = async (req, res) => {
  try {
    const { problemId, title, content, type, tags, language, code } = req.body;
    const userId = req.user._id;

    // Validate problem exists
    const problem = await Problem.findById(problemId);
    if (!problem) {
      return res.status(404).json({
        success: false,
        message: 'Problem not found'
      });
    }

    // Validate required fields
    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: 'Title and content are required'
      });
    }

    const discussion = new Discussion({
      problemId,
      userId,
      title,
      content,
      type: type || 'discussion',
      tags: tags || [],
      language,
      code
    });

    await discussion.save();

    // Populate user info
    await discussion.populate('userId', 'username profilePicture');

    res.status(201).json({
      success: true,
      message: 'Discussion created successfully',
      discussion
    });
  } catch (error) {
    console.error('Error creating discussion:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create discussion',
      error: error.message
    });
  }
};

// Update discussion
exports.updateDiscussion = async (req, res) => {
  try {
    const { discussionId } = req.params;
    const { title, content, tags, language, code } = req.body;
    const userId = req.user._id;

    const discussion = await Discussion.findById(discussionId);

    if (!discussion) {
      return res.status(404).json({
        success: false,
        message: 'Discussion not found'
      });
    }

    // Check if user is the author
    if (discussion.userId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only edit your own discussions'
      });
    }

    // Update fields
    if (title) discussion.title = title;
    if (content) discussion.content = content;
    if (tags) discussion.tags = tags;
    if (language) discussion.language = language;
    if (code !== undefined) discussion.code = code;

    discussion.isEdited = true;
    discussion.editedAt = new Date();

    await discussion.save();

    res.json({
      success: true,
      message: 'Discussion updated successfully',
      discussion
    });
  } catch (error) {
    console.error('Error updating discussion:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update discussion',
      error: error.message
    });
  }
};

// Delete discussion
exports.deleteDiscussion = async (req, res) => {
  try {
    const { discussionId } = req.params;
    const userId = req.user._id;

    const discussion = await Discussion.findById(discussionId);

    if (!discussion) {
      return res.status(404).json({
        success: false,
        message: 'Discussion not found'
      });
    }

    // Check if user is the author or admin
    const isAdmin = req.user.role === 'superadmin';
    const isAuthor = discussion.userId.toString() === userId.toString();

    if (!isAuthor && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own discussions'
      });
    }

    await discussion.deleteOne();

    res.json({
      success: true,
      message: 'Discussion deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting discussion:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete discussion',
      error: error.message
    });
  }
};

// Vote on discussion
exports.voteDiscussion = async (req, res) => {
  try {
    const { discussionId } = req.params;
    const { voteType } = req.body; // 'upvote', 'downvote', or 'none' to remove vote
    const userId = req.user._id;

    if (!['upvote', 'downvote', 'none'].includes(voteType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid vote type'
      });
    }

    const discussion = await Discussion.findById(discussionId);

    if (!discussion) {
      return res.status(404).json({
        success: false,
        message: 'Discussion not found'
      });
    }

    // Apply vote
    discussion.vote(userId, voteType === 'none' ? null : voteType);
    await discussion.save();

    res.json({
      success: true,
      message: 'Vote updated successfully',
      voteScore: discussion.voteScore
    });
  } catch (error) {
    console.error('Error voting on discussion:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to vote',
      error: error.message
    });
  }
};

// Add reply to discussion
exports.addReply = async (req, res) => {
  try {
    const { discussionId } = req.params;
    const { content } = req.body;
    const userId = req.user._id;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Reply content is required'
      });
    }

    const discussion = await Discussion.findById(discussionId);

    if (!discussion) {
      return res.status(404).json({
        success: false,
        message: 'Discussion not found'
      });
    }

    // Add reply
    discussion.replies.push({
      userId,
      content: content.trim(),
      votes: { upvotes: [], downvotes: [] }
    });

    await discussion.save();

    // Populate the new reply's user info
    await discussion.populate('replies.userId', 'username profilePicture');

    const newReply = discussion.replies[discussion.replies.length - 1];

    res.status(201).json({
      success: true,
      message: 'Reply added successfully',
      reply: newReply
    });
  } catch (error) {
    console.error('Error adding reply:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add reply',
      error: error.message
    });
  }
};

// Update reply
exports.updateReply = async (req, res) => {
  try {
    const { discussionId, replyId } = req.params;
    const { content } = req.body;
    const userId = req.user._id;

    const discussion = await Discussion.findById(discussionId);

    if (!discussion) {
      return res.status(404).json({
        success: false,
        message: 'Discussion not found'
      });
    }

    const reply = discussion.replies.id(replyId);

    if (!reply) {
      return res.status(404).json({
        success: false,
        message: 'Reply not found'
      });
    }

    // Check if user is the author
    if (reply.userId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only edit your own replies'
      });
    }

    if (content) reply.content = content;
    reply.isEdited = true;
    reply.editedAt = new Date();

    await discussion.save();

    res.json({
      success: true,
      message: 'Reply updated successfully',
      reply
    });
  } catch (error) {
    console.error('Error updating reply:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update reply',
      error: error.message
    });
  }
};

// Delete reply
exports.deleteReply = async (req, res) => {
  try {
    const { discussionId, replyId } = req.params;
    const userId = req.user._id;

    const discussion = await Discussion.findById(discussionId);

    if (!discussion) {
      return res.status(404).json({
        success: false,
        message: 'Discussion not found'
      });
    }

    const reply = discussion.replies.id(replyId);

    if (!reply) {
      return res.status(404).json({
        success: false,
        message: 'Reply not found'
      });
    }

    // Check if user is the author or admin
    const isAdmin = req.user.role === 'superadmin';
    const isAuthor = reply.userId.toString() === userId.toString();

    if (!isAuthor && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own replies'
      });
    }

    reply.deleteOne();
    await discussion.save();

    res.json({
      success: true,
      message: 'Reply deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting reply:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete reply',
      error: error.message
    });
  }
};

// Vote on reply
exports.voteReply = async (req, res) => {
  try {
    const { discussionId, replyId } = req.params;
    const { voteType } = req.body;
    const userId = req.user._id;

    if (!['upvote', 'downvote', 'none'].includes(voteType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid vote type'
      });
    }

    const discussion = await Discussion.findById(discussionId);

    if (!discussion) {
      return res.status(404).json({
        success: false,
        message: 'Discussion not found'
      });
    }

    const success = discussion.voteReply(replyId, userId, voteType === 'none' ? null : voteType);

    if (!success) {
      return res.status(404).json({
        success: false,
        message: 'Reply not found'
      });
    }

    await discussion.save();

    const reply = discussion.replies.id(replyId);
    const voteScore = reply.votes.upvotes.length - reply.votes.downvotes.length;

    res.json({
      success: true,
      message: 'Vote updated successfully',
      voteScore
    });
  } catch (error) {
    console.error('Error voting on reply:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to vote',
      error: error.message
    });
  }
};

// Mark solution as accepted (problem author or admin only)
exports.markAsAccepted = async (req, res) => {
  try {
    const { discussionId } = req.params;
    const userId = req.user._id;

    const discussion = await Discussion.findById(discussionId).populate('problemId');

    if (!discussion) {
      return res.status(404).json({
        success: false,
        message: 'Discussion not found'
      });
    }

    // Check if user is problem creator or admin
    const isAdmin = req.user.role === 'superadmin';
    const isProblemCreator = discussion.problemId.createdBy?.toString() === userId.toString();

    if (!isAdmin && !isProblemCreator) {
      return res.status(403).json({
        success: false,
        message: 'Only problem creators or admins can mark solutions as accepted'
      });
    }

    discussion.isAccepted = true;
    await discussion.save();

    res.json({
      success: true,
      message: 'Solution marked as accepted'
    });
  } catch (error) {
    console.error('Error marking as accepted:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark as accepted',
      error: error.message
    });
  }
};

// Flag discussion (moderation)
exports.flagDiscussion = async (req, res) => {
  try {
    const { discussionId } = req.params;
    const { reason } = req.body;

    const discussion = await Discussion.findById(discussionId);

    if (!discussion) {
      return res.status(404).json({
        success: false,
        message: 'Discussion not found'
      });
    }

    discussion.isFlagged = true;
    await discussion.save();

    // TODO: Create notification for moderators
    // TODO: Log the flag reason for moderation review

    res.json({
      success: true,
      message: 'Discussion flagged for review'
    });
  } catch (error) {
    console.error('Error flagging discussion:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to flag discussion',
      error: error.message
    });
  }
};

module.exports = exports;
