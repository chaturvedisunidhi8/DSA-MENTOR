const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ["user", "ai"],
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const questionResponseSchema = new mongoose.Schema({
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Problem",
    required: true,
  },
  code: String,
  language: String,
  submitted: {
    type: Boolean,
    default: false,
  },
  score: {
    type: Number,
    min: 0,
    max: 100,
  },
  feedback: String,
  strengths: [String],
  improvements: [String],
  timeComplexity: String,
  spaceComplexity: String,
  hintsUsed: {
    type: Number,
    default: 0,
  },
  timeSpent: Number, // in seconds
});

const interviewSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    interviewType: {
      type: String,
      enum: ["conversational", "timed", "mock"],
      required: true,
    },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard", "mixed"],
      required: true,
    },
    topics: [String],
    duration: {
      type: Number, // in minutes
      required: true,
    },
    questionCount: {
      type: Number,
      required: true,
    },
    questions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Problem",
      },
    ],
    currentQuestionIndex: {
      type: Number,
      default: 0,
    },
    responses: [questionResponseSchema],
    messages: [messageSchema],
    status: {
      type: String,
      enum: ["setup", "in-progress", "completed", "abandoned"],
      default: "setup",
    },
    startedAt: Date,
    completedAt: Date,
    timeRemaining: Number, // in seconds
    // Results
    overallScore: {
      type: Number,
      min: 0,
      max: 100,
    },
    problemSolvingScore: Number,
    codeQualityScore: Number,
    communicationScore: Number,
    timeManagementScore: Number,
    accuracy: Number,
    questionsCompleted: {
      type: Number,
      default: 0,
    },
    totalHintsUsed: {
      type: Number,
      default: 0,
    },
    summary: String,
    detailedFeedback: String,
    recommendations: [
      {
        icon: String,
        title: String,
        description: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Virtual for time spent
interviewSchema.virtual("timeSpent").get(function () {
  if (this.startedAt && this.completedAt) {
    return Math.floor((this.completedAt - this.startedAt) / 1000 / 60); // in minutes
  }
  return 0;
});

// Method to calculate scores
interviewSchema.methods.calculateScores = function () {
  const responses = this.responses.filter((r) => r.submitted);
  
  if (responses.length === 0) {
    this.overallScore = 0;
    this.accuracy = 0;
    return;
  }

  // Calculate average score
  const avgScore = responses.reduce((sum, r) => sum + (r.score || 0), 0) / responses.length;
  
  // Calculate accuracy
  const passedQuestions = responses.filter((r) => (r.score || 0) >= 70).length;
  this.accuracy = Math.round((passedQuestions / responses.length) * 100);
  
  // Calculate component scores
  this.problemSolvingScore = Math.round(avgScore);
  
  // Code quality based on hints used
  const avgHints = this.totalHintsUsed / responses.length;
  this.codeQualityScore = Math.max(60, 100 - avgHints * 10);
  
  // Communication score based on message interactions
  const messageCount = this.messages.filter((m) => m.role === "user").length;
  this.communicationScore = Math.min(100, 50 + messageCount * 5);
  
  // Time management
  const timeUsed = (this.duration * 60 - this.timeRemaining) / 60;
  const timeEfficiency = (timeUsed / this.duration) * 100;
  this.timeManagementScore = timeEfficiency < 80 ? 90 : timeEfficiency < 95 ? 100 : 80;
  
  // Overall score (weighted average)
  this.overallScore = Math.round(
    this.problemSolvingScore * 0.4 +
    this.codeQualityScore * 0.25 +
    this.communicationScore * 0.2 +
    this.timeManagementScore * 0.15
  );
  
  this.questionsCompleted = responses.length;
};

// Method to generate summary
interviewSchema.methods.generateSummary = function () {
  const score = this.overallScore;
  
  if (score >= 90) {
    this.summary = "Outstanding performance! You demonstrated excellent problem-solving skills and code quality.";
  } else if (score >= 80) {
    this.summary = "Great job! You showed strong technical skills with room for minor improvements.";
  } else if (score >= 70) {
    this.summary = "Good effort! You have solid fundamentals but could benefit from more practice.";
  } else if (score >= 60) {
    this.summary = "Fair performance. Focus on strengthening your problem-solving approach and code quality.";
  } else {
    this.summary = "Keep practicing! Review fundamental concepts and practice more problems.";
  }
};

// Method to generate recommendations
interviewSchema.methods.generateRecommendations = function () {
  this.recommendations = [];
  
  if (this.problemSolvingScore < 70) {
    this.recommendations.push({
      icon: "📚",
      title: "Practice More Problems",
      description: "Focus on solving problems in your weak areas: " + this.topics.join(", "),
    });
  }
  
  if (this.codeQualityScore < 70) {
    this.recommendations.push({
      icon: "✨",
      title: "Improve Code Quality",
      description: "Work on writing cleaner, more efficient code with proper naming and structure.",
    });
  }
  
  if (this.communicationScore < 70) {
    this.recommendations.push({
      icon: "💬",
      title: "Practice Explaining",
      description: "Practice articulating your thought process and approach clearly during interviews.",
    });
  }
  
  if (this.timeManagementScore < 70) {
    this.recommendations.push({
      icon: "⏰",
      title: "Time Management",
      description: "Practice solving problems under time constraints to improve your speed.",
    });
  }
  
  // Always add some general recommendations
  this.recommendations.push({
    icon: "🎯",
    title: "Mock Interviews",
    description: "Take more mock interviews to build confidence and identify areas for improvement.",
  });
  
  this.recommendations.push({
    icon: "🔄",
    title: "Review Solutions",
    description: "Study optimal solutions and different approaches to problems you've solved.",
  });
};

// Indexes for better query performance (crucial for 10k+ users)
// Note: userId reference field doesn't need explicit index when used in compound indexes
interviewSchema.index({ userId: 1, createdAt: -1 }); // User's interviews sorted by date (compound covers userId alone)
interviewSchema.index({ status: 1, createdAt: -1 }); // Filter by status
interviewSchema.index({ userId: 1, status: 1 }); // User's interviews by status
interviewSchema.index({ overallScore: -1 }); // Sort by score
interviewSchema.index({ completedAt: -1 }); // Sort by completion date

const Interview = mongoose.model("Interview", interviewSchema);

module.exports = Interview;
