const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "Username is required"],
      unique: true,
      trim: true,
      minlength: [3, "Username must be at least 3 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
    },
    role: {
      type: String,
      enum: ["client", "mentor", "superadmin"],
      default: "client",
    },
    roleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Role",
      default: null
    },
    permissions: [{
      type: String
    }],
    refreshToken: {
      type: String,
      default: null,
    },
    // User stats
    problemsSolved: {
      type: Number,
      default: 0,
    },
    accuracy: {
      type: Number,
      default: 0,
    },
    currentLevel: {
      type: String,
      enum: ["Beginner", "Intermediate", "Advanced", "Expert"],
      default: "Beginner",
    },
    streak: {
      type: Number,
      default: 0,
    },
    focusAreas: {
      type: [String],
      default: [],
    },
    lastActive: {
      type: Date,
      default: Date.now,
    },
    // Profile fields
    bio: {
      type: String,
      default: "",
      maxlength: [500, "Bio must be less than 500 characters"],
    },
    phone: {
      type: String,
      default: "",
      trim: true,
    },
    github: {
      type: String,
      default: "",
      trim: true,
    },
    linkedin: {
      type: String,
      default: "",
      trim: true,
    },
    skills: {
      type: [String],
      default: [],
    },
    experience: {
      type: String,
      default: "",
    },
    education: {
      type: String,
      default: "",
    },
    // Resume fields
    resumeUrl: {
      type: String,
      default: null,
    },
    resumeData: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    resumeUploadedAt: {
      type: Date,
      default: null,
    },
    // Profile picture
    profilePicture: {
      type: String,
      default: null,
    },
    profilePictureUploadedAt: {
      type: Date,
      default: null,
    },
    // Achievements
    achievements: [
      {
        achievementId: String,
        unlockedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    badges: {
      bronze: { type: Number, default: 0 },
      silver: { type: Number, default: 0 },
      gold: { type: Number, default: 0 },
      platinum: { type: Number, default: 0 },
    },
    // Problem tracking for achievements
    solvedProblems: [
      {
        problemId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Problem",
        },
        solvedAt: {
          type: Date,
          default: Date.now,
        },
        score: Number,
      },
    ],
    // Mentor-specific fields
    mentorInfo: {
      students: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }],
      organization: String,
      specializations: [String],
      yearsOfExperience: Number,
      isVerified: {
        type: Boolean,
        default: false
      }
    },
    // Portfolio settings
    portfolioPublic: {
      type: Boolean,
      default: true
    },
    // Social/Community features
    following: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    followers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    recentActivity: [{
      type: {
        type: String,
        enum: ['solved_problem', 'earned_achievement', 'started_track', 'completed_interview', 'posted_discussion']
      },
      problemId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Problem'
      },
      trackId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CareerTrack'
      },
      discussionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Discussion'
      },
      achievementId: String,
      details: String,
      timestamp: {
        type: Date,
        default: Date.now
      }
    }]
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Method to compare password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Indexes for better query performance (crucial for 10k+ users)
// Note: email and username unique indexes are auto-created
userSchema.index({ role: 1 }); // For filtering by role
userSchema.index({ lastActive: -1 }); // For sorting by activity
userSchema.index({ createdAt: -1 }); // For sorting by registration date
userSchema.index({ 'problemsSolved': -1, 'accuracy': -1 }); // Compound index for leaderboards
userSchema.index({ refreshToken: 1 }, { sparse: true }); // Sparse index for refresh tokens
userSchema.index({ followers: 1 }); // For follow queries
userSchema.index({ following: 1 }); // For following queries
userSchema.index({ 'recentActivity.timestamp': -1 }); // For activity feed sorting

module.exports = mongoose.model("User", userSchema);
