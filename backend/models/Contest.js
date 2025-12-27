const mongoose = require('mongoose');

const contestSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  slug: {
    type: String,
    required: true,
    unique: true
  },
  description: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['weekly', 'monthly', 'special', 'practice'],
    default: 'weekly'
  },
  difficulty: {
    type: String,
    enum: ['Easy', 'Medium', 'Hard', 'Mixed'],
    default: 'Mixed'
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: true
  },
  duration: {
    type: Number, // in minutes
    required: true
  },
  problems: [{
    problemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Problem',
      required: true
    },
    order: {
      type: Number,
      required: true
    },
    points: {
      type: Number,
      required: true,
      default: 100
    }
  }],
  rules: [{
    type: String
  }],
  prizes: [{
    rank: Number,
    description: String,
    badge: String
  }],
  isPublic: {
    type: Boolean,
    default: true
  },
  status: {
    type: String,
    enum: ['upcoming', 'live', 'completed', 'cancelled'],
    default: 'upcoming'
  },
  registrationRequired: {
    type: Boolean,
    default: true
  },
  maxParticipants: {
    type: Number,
    default: null
  },
  participantCount: {
    type: Number,
    default: 0
  },
  tags: [{
    type: String
  }],
  bannerImage: {
    type: String
  }
}, {
  timestamps: true
});

const contestParticipantSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  contestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Contest',
    required: true
  },
  registeredAt: {
    type: Date,
    default: Date.now
  },
  startedAt: {
    type: Date
  },
  finishedAt: {
    type: Date
  },
  submissions: [{
    problemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Problem'
    },
    code: String,
    language: String,
    submittedAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['accepted', 'wrong_answer', 'runtime_error', 'time_limit', 'compilation_error'],
      default: 'wrong_answer'
    },
    testsPassed: Number,
    totalTests: Number,
    timeTaken: Number, // in seconds from contest start
    penalty: {
      type: Number,
      default: 0
    }
  }],
  solvedProblems: [{
    problemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Problem'
    },
    solvedAt: Date,
    attempts: Number,
    timeTaken: Number // in seconds from contest start
  }],
  totalScore: {
    type: Number,
    default: 0
  },
  rank: {
    type: Number
  },
  penalty: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes for better performance
contestSchema.index({ slug: 1 });
contestSchema.index({ status: 1, startTime: 1 });
contestSchema.index({ type: 1, status: 1 });

contestParticipantSchema.index({ contestId: 1, userId: 1 }, { unique: true });
contestParticipantSchema.index({ contestId: 1, totalScore: -1, penalty: 1 });

const Contest = mongoose.model('Contest', contestSchema);
const ContestParticipant = mongoose.model('ContestParticipant', contestParticipantSchema);

module.exports = { Contest, ContestParticipant };
