const mongoose = require('mongoose');

const replySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  votes: {
    upvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    downvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
  },
  isEdited: {
    type: Boolean,
    default: false
  },
  editedAt: Date,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const discussionSchema = new mongoose.Schema({
  problemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Problem',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['question', 'solution', 'discussion', 'bug-report'],
    default: 'discussion'
  },
  tags: [{
    type: String,
    trim: true
  }],
  language: {
    type: String,
    enum: ['javascript', 'python', 'java', 'cpp', 'other'],
    default: 'other'
  },
  code: String, // Optional code snippet for solution posts
  votes: {
    upvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    downvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
  },
  replies: [replySchema],
  views: {
    type: Number,
    default: 0
  },
  isAccepted: {
    type: Boolean,
    default: false // For solution posts
  },
  isFlagged: {
    type: Boolean,
    default: false
  },
  isEdited: {
    type: Boolean,
    default: false
  },
  editedAt: Date,
  isPinned: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
discussionSchema.index({ problemId: 1, createdAt: -1 });
discussionSchema.index({ userId: 1 });
discussionSchema.index({ type: 1 });
discussionSchema.index({ 'votes.upvotes': 1 });
discussionSchema.index({ createdAt: -1 });
discussionSchema.index({ tags: 1 });

// Virtual for vote count
discussionSchema.virtual('voteScore').get(function() {
  return this.votes.upvotes.length - this.votes.downvotes.length;
});

// Virtual for reply count
discussionSchema.virtual('replyCount').get(function() {
  return this.replies.length;
});

// Virtual for hot score (Reddit-like algorithm)
discussionSchema.virtual('hotScore').get(function() {
  const ageInHours = (Date.now() - this.createdAt) / (1000 * 60 * 60);
  const score = this.voteScore + (this.replies.length * 2) + (this.views / 10);
  
  // Decay over time
  return score / Math.pow(ageInHours + 2, 1.5);
});

discussionSchema.set('toJSON', { virtuals: true });
discussionSchema.set('toObject', { virtuals: true });

// Instance methods

// Check if user has voted
discussionSchema.methods.getUserVote = function(userId) {
  if (!userId) return null;
  const userIdStr = userId.toString();
  
  if (this.votes.upvotes.some(id => id.toString() === userIdStr)) {
    return 'upvote';
  }
  if (this.votes.downvotes.some(id => id.toString() === userIdStr)) {
    return 'downvote';
  }
  return null;
};

// Vote on discussion
discussionSchema.methods.vote = function(userId, voteType) {
  const userIdStr = userId.toString();
  
  // Remove existing votes
  this.votes.upvotes = this.votes.upvotes.filter(id => id.toString() !== userIdStr);
  this.votes.downvotes = this.votes.downvotes.filter(id => id.toString() !== userIdStr);
  
  // Add new vote
  if (voteType === 'upvote') {
    this.votes.upvotes.push(userId);
  } else if (voteType === 'downvote') {
    this.votes.downvotes.push(userId);
  }
  // If voteType is 'none' or null, just remove votes (done above)
};

// Vote on reply
discussionSchema.methods.voteReply = function(replyId, userId, voteType) {
  const reply = this.replies.id(replyId);
  if (!reply) return false;
  
  const userIdStr = userId.toString();
  
  // Remove existing votes
  reply.votes.upvotes = reply.votes.upvotes.filter(id => id.toString() !== userIdStr);
  reply.votes.downvotes = reply.votes.downvotes.filter(id => id.toString() !== userIdStr);
  
  // Add new vote
  if (voteType === 'upvote') {
    reply.votes.upvotes.push(userId);
  } else if (voteType === 'downvote') {
    reply.votes.downvotes.push(userId);
  }
  
  return true;
};

const Discussion = mongoose.model('Discussion', discussionSchema);

module.exports = Discussion;
