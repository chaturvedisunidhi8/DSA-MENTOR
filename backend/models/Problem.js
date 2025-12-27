const mongoose = require("mongoose");
const testCaseSchema = new mongoose.Schema({
  input: {
    type: String,
    required: true,
  },
  output: {
    type: String,
    required: true,
  },
  isHidden: {
    type: Boolean,
    default: false,
  },
});
const problemSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      sparse: true,
    },
    description: {
      type: String,
      required: true,
    },
    difficulty: {
      type: String,
      enum: ["Easy", "Medium", "Hard"],
      required: true,
    },
    topics: [
      {
        type: String,
        required: true,
      },
    ],
    companies: [
      {
        type: String,
      },
    ],
    constraints: {
      type: String,
    },
    inputFormat: {
      type: String,
    },
    outputFormat: {
      type: String,
    },
    sampleTestCases: [testCaseSchema],
    hiddenTestCases: [testCaseSchema],
    hints: [
      {
        type: String,
      },
    ],
    starterCode: {
      javascript: String,
      python: String,
      java: String,
      cpp: String,
    },
    solution: {
      approach: String,
      code: String,
      timeComplexity: String,
      spaceComplexity: String,
    },
    stats: {
      totalSubmissions: {
        type: Number,
        default: 0,
      },
      acceptedSubmissions: {
        type: Number,
        default: 0,
      },
      totalAttempts: {
        type: Number,
        default: 0,
      },
    },
    // Crowdsourced interview frequency data
    interviewReports: [{
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      company: {
        type: String,
        required: true,
        trim: true
      },
      interviewDate: {
        type: Date,
        required: true
      },
      position: {
        type: String,
        trim: true
      },
      interviewRound: {
        type: String,
        enum: ['Phone Screen', 'Technical Round 1', 'Technical Round 2', 'Onsite', 'Final Round', 'Other'],
        default: 'Other'
      },
      reportedAt: {
        type: Date,
        default: Date.now
      },
      verified: {
        type: Boolean,
        default: false
      }
    }],
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);
problemSchema.pre("save", function (next) {
  if (this.isModified("title") || !this.slug) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }
  next();
});
problemSchema.virtual("acceptanceRate").get(function () {
  if (this.stats.totalSubmissions === 0) return 0;
  return Math.round(
    (this.stats.acceptedSubmissions / this.stats.totalSubmissions) * 100
  );
});

// Virtual for recent interview frequency (last 90 days)
problemSchema.virtual("recentFrequency").get(function () {
  if (!this.interviewReports || this.interviewReports.length === 0) return [];
  
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
  
  const recentReports = this.interviewReports.filter(
    report => report.interviewDate >= ninetyDaysAgo
  );
  
  // Group by company and count
  const frequencyByCompany = {};
  recentReports.forEach(report => {
    const company = report.company;
    frequencyByCompany[company] = (frequencyByCompany[company] || 0) + 1;
  });
  
  // Convert to array and sort by frequency
  return Object.entries(frequencyByCompany)
    .map(([company, count]) => ({ company, count }))
    .sort((a, b) => b.count - a.count);
});

// Virtual for total times asked
problemSchema.virtual("totalTimesAsked").get(function () {
  return this.interviewReports ? this.interviewReports.length : 0;
});

problemSchema.set("toJSON", { virtuals: true });
problemSchema.set("toObject", { virtuals: true });

// Indexes for better query performance (crucial for 10k+ users)
// Note: slug unique index is auto-created
problemSchema.index({ difficulty: 1 }); // Filter by difficulty
problemSchema.index({ topics: 1 }); // Filter by topics (array index)
problemSchema.index({ isActive: 1 }); // Filter active problems
problemSchema.index({ 'stats.acceptedSubmissions': -1 }); // Sort by popularity
problemSchema.index({ difficulty: 1, topics: 1, isActive: 1 }); // Compound for complex queries
problemSchema.index({ createdAt: -1 }); // Sort by creation date
problemSchema.index({ 'interviewReports.company': 1 }); // Query by company
problemSchema.index({ 'interviewReports.interviewDate': -1 }); // Sort by interview date

module.exports = mongoose.model("Problem", problemSchema);
