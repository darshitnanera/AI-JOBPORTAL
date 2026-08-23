import mongoose from "mongoose";

const jobMatchSchema = new mongoose.Schema(
  {
    candidateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true,
    },
    matchScore: {
      type: Number,
      min: 0,
      max: 100,
      required: true,
    },
    matchDetails: {
      skillMatch: {
        matchingSkills: [String],
        missingSkills: [String],
        matchPercentage: Number,
        totalRequired: Number,
        totalMatched: Number,
      },
      experienceMatch: {
        score: Number,
        candidateExp: Number,
        requiredExp: Number,
      },
      educationMatch: {
        score: Number,
        candidate: [String],
        required: [String],
      },
      additionalBonus: Number,
      gapSeverity: String,
      explanation: String,
      scoreBreakdown: {
        skills: Number,
        experience: Number,
        education: Number,
        additional: Number,
      },
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Index for fast lookups
jobMatchSchema.index({ candidateId: 1, jobId: 1 }, { unique: true });
jobMatchSchema.index({ candidateId: 1, matchScore: -1 });
jobMatchSchema.index({ jobId: 1, matchScore: -1 });

export default mongoose.model("JobMatch", jobMatchSchema);
