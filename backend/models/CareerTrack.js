const mongoose = require('mongoose');

const lessonSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: String,
  problemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Problem',
    required: true
  },
  order: {
    type: Number,
    required: true
  },
  estimatedTime: Number, // in minutes
  videoUrl: String,
  resources: [{
    title: String,
    url: String,
    type: {
      type: String,
      enum: ['article', 'video', 'documentation', 'tutorial']
    }
  }]
});

const moduleSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: String,
  order: {
    type: Number,
    required: true
  },
  icon: String, // emoji or icon name
  lessons: [lessonSchema],
  prerequisiteModules: [{
    type: mongoose.Schema.Types.ObjectId
  }], // References to other module _ids in the same track
  unlockRequirement: {
    type: {
      type: String,
      enum: ['problems_solved', 'module_completed', 'achievement', 'always_unlocked'],
      default: 'always_unlocked'
    },
    count: Number, // number of problems if type is 'problems_solved'
    moduleId: mongoose.Schema.Types.ObjectId, // if type is 'module_completed'
    achievementId: String // if type is 'achievement'
  }
});

const careerTrackSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  slug: {
    type: String,
    unique: true,
    trim: true,
    lowercase: true
  },
  description: {
    type: String,
    required: true
  },
  longDescription: String,
  category: {
    type: String,
    enum: ['interview-prep', 'role-specific', 'company-specific', 'topic-mastery', 'bootcamp'],
    required: true
  },
  targetRole: String, // e.g., "Backend Engineer", "Google L4", "Full Stack"
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced', 'mixed'],
    default: 'mixed'
  },
  estimatedDuration: String, // e.g., "4 weeks", "2 months"
  modules: [moduleSchema],
  icon: String, // emoji or icon name
  color: {
    type: String,
    default: '#6366f1'
  },
  isPremium: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  tags: [String],
  enrollmentCount: {
    type: Number,
    default: 0
  },
  completionCount: {
    type: Number,
    default: 0
  },
  rating: {
    average: {
      type: Number,
      default: 0
    },
    count: {
      type: Number,
      default: 0
    }
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Generate slug from title before saving
careerTrackSchema.pre('save', function(next) {
  if (this.isModified('title') && !this.slug) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
  next();
});

// Indexes for efficient querying
careerTrackSchema.index({ slug: 1 });
careerTrackSchema.index({ category: 1, isActive: 1 });
careerTrackSchema.index({ isPremium: 1 });
careerTrackSchema.index({ 'rating.average': -1 });
careerTrackSchema.index({ enrollmentCount: -1 });
careerTrackSchema.index({ tags: 1 });

// Virtual for total lessons count
careerTrackSchema.virtual('totalLessons').get(function() {
  return this.modules.reduce((total, module) => total + module.lessons.length, 0);
});

// Virtual for total problems count
careerTrackSchema.virtual('totalProblems').get(function() {
  return this.totalLessons; // Each lesson has one problem
});

careerTrackSchema.set('toJSON', { virtuals: true });
careerTrackSchema.set('toObject', { virtuals: true });

// Schema for tracking user progress through career tracks
const userTrackProgressSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  trackId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CareerTrack',
    required: true
  },
  enrolledAt: {
    type: Date,
    default: Date.now
  },
  completedAt: Date,
  status: {
    type: String,
    enum: ['enrolled', 'in-progress', 'completed', 'paused'],
    default: 'enrolled'
  },
  currentModuleIndex: {
    type: Number,
    default: 0
  },
  currentLessonIndex: {
    type: Number,
    default: 0
  },
  completedModules: [{
    moduleId: mongoose.Schema.Types.ObjectId,
    completedAt: Date
  }],
  completedLessons: [{
    lessonId: mongoose.Schema.Types.ObjectId,
    problemId: mongoose.Schema.Types.ObjectId,
    completedAt: Date,
    score: Number,
    timeSpent: Number // in seconds
  }],
  unlockedModules: [{
    moduleId: mongoose.Schema.Types.ObjectId,
    unlockedAt: {
      type: Date,
      default: Date.now
    }
  }],
  totalTimeSpent: {
    type: Number,
    default: 0 // in seconds
  },
  rating: {
    score: Number, // 1-5
    review: String,
    ratedAt: Date
  }
}, {
  timestamps: true
});

// Compound indexes for efficient querying
userTrackProgressSchema.index({ userId: 1, trackId: 1 }, { unique: true });
userTrackProgressSchema.index({ userId: 1, status: 1 });
userTrackProgressSchema.index({ trackId: 1, status: 1 });
userTrackProgressSchema.index({ userId: 1, updatedAt: -1 });

// Virtual for completion percentage
userTrackProgressSchema.virtual('completionPercentage').get(function() {
  if (!this.populated('trackId')) return 0;
  const track = this.trackId;
  const totalLessons = track.modules.reduce((sum, mod) => sum + mod.lessons.length, 0);
  if (totalLessons === 0) return 0;
  return Math.round((this.completedLessons.length / totalLessons) * 100);
});

userTrackProgressSchema.set('toJSON', { virtuals: true });
userTrackProgressSchema.set('toObject', { virtuals: true });

const CareerTrack = mongoose.model('CareerTrack', careerTrackSchema);
const UserTrackProgress = mongoose.model('UserTrackProgress', userTrackProgressSchema);

module.exports = { CareerTrack, UserTrackProgress };
