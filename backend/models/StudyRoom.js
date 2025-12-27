const mongoose = require('mongoose');

const studyRoomSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
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
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['public', 'private', 'invite-only'],
    default: 'public'
  },
  maxParticipants: {
    type: Number,
    default: 10,
    min: 2,
    max: 20
  },
  currentParticipants: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    role: {
      type: String,
      enum: ['owner', 'moderator', 'participant'],
      default: 'participant'
    }
  }],
  problem: {
    problemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Problem'
    },
    title: String,
    slug: String
  },
  sharedCode: {
    type: String,
    default: ''
  },
  language: {
    type: String,
    default: 'javascript'
  },
  chat: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    username: String,
    message: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  codeHistory: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    username: String,
    code: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  status: {
    type: String,
    enum: ['active', 'paused', 'completed', 'closed'],
    default: 'active'
  },
  inviteCode: {
    type: String,
    unique: true,
    sparse: true
  },
  tags: [{
    type: String
  }],
  isLocked: {
    type: Boolean,
    default: false
  },
  expiresAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes
studyRoomSchema.index({ slug: 1 });
studyRoomSchema.index({ createdBy: 1 });
studyRoomSchema.index({ status: 1, type: 1 });
studyRoomSchema.index({ inviteCode: 1 });

const StudyRoom = mongoose.model('StudyRoom', studyRoomSchema);

module.exports = StudyRoom;
