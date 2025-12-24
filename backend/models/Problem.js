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

module.exports = mongoose.model("Problem", problemSchema);
