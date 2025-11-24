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
      required: true,
      unique: true,
      lowercase: true,
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
  if (this.isModified("title")) {
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
module.exports = mongoose.model("Problem", problemSchema);
