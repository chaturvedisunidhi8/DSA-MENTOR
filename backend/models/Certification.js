const mongoose = require('mongoose');

const certificationSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    unique: true
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
  category: {
    type: String,
    required: true,
    enum: ['DSA', 'System Design', 'Frontend', 'Backend', 'Full Stack']
  },
  difficulty: {
    type: String,
    required: true,
    enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert']
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'INR'
  },
  duration: {
    type: Number, // in minutes
    required: true,
    default: 90
  },
  passingScore: {
    type: Number,
    required: true,
    default: 70,
    min: 0,
    max: 100
  },
  problems: [{
    problemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Problem',
      required: true
    },
    points: {
      type: Number,
      required: true,
      default: 100
    }
  }],
  prerequisites: [{
    type: String
  }],
  skills: [{
    type: String
  }],
  badgeImage: {
    type: String
  },
  certificateTemplate: {
    type: String
  },
  isActive: {
    type: Boolean,
    default: true
  },
  enrollmentCount: {
    type: Number,
    default: 0
  },
  completionCount: {
    type: Number,
    default: 0
  },
  averageScore: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

const certificationAttemptSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  certificationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Certification',
    required: true
  },
  attemptNumber: {
    type: Number,
    required: true,
    default: 1
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'completed', 'failed', 'cancelled'],
    default: 'pending'
  },
  startedAt: {
    type: Date
  },
  completedAt: {
    type: Date
  },
  timeSpent: {
    type: Number, // in seconds
    default: 0
  },
  problemResults: [{
    problemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Problem'
    },
    code: String,
    language: String,
    score: {
      type: Number,
      default: 0
    },
    maxScore: Number,
    testResults: {
      passed: Number,
      total: Number
    },
    submittedAt: Date
  }],
  totalScore: {
    type: Number,
    default: 0
  },
  maxPossibleScore: {
    type: Number,
    required: true
  },
  percentage: {
    type: Number,
    default: 0
  },
  passed: {
    type: Boolean,
    default: false
  },
  certificateUrl: {
    type: String
  },
  certificateId: {
    type: String,
    unique: true,
    sparse: true
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'refunded'],
    default: 'pending'
  },
  paymentId: {
    type: String
  },
  paymentAmount: {
    type: Number
  },
  proctor: {
    screenRecording: Boolean,
    webcamRecording: Boolean,
    browserLock: Boolean,
    tabSwitches: {
      type: Number,
      default: 0
    },
    suspiciousActivity: [{
      type: String,
      timestamp: Date
    }]
  }
}, {
  timestamps: true
});

// Indexes for better query performance
certificationSchema.index({ slug: 1 });
certificationSchema.index({ category: 1, difficulty: 1 });
certificationSchema.index({ isActive: 1 });

certificationAttemptSchema.index({ userId: 1, certificationId: 1 });
certificationAttemptSchema.index({ userId: 1, status: 1 });
certificationAttemptSchema.index({ certificateId: 1 });

const Certification = mongoose.model('Certification', certificationSchema);
const CertificationAttempt = mongoose.model('CertificationAttempt', certificationAttemptSchema);

module.exports = { Certification, CertificationAttempt };
