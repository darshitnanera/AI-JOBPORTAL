import mongoose from "mongoose";

const jobRecommendationSchema = new mongoose.Schema(
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
    reason: String,
    status: {
      type: String,
      enum: ["pending", "viewed", "applied", "rejected", "expired"],
      default: "pending",
    },
    viewedAt: Date,
    appliedAt: Date,
    rejectedAt: Date,
    recommendedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Index for fast lookups
jobRecommendationSchema.index({ candidateId: 1, status: 1 });
jobRecommendationSchema.index({ candidateId: 1, matchScore: -1 });
jobRecommendationSchema.index({ recommendedAt: -1 });
jobRecommendationSchema.index({ jobId: 1 });

export default mongoose.model("JobRecommendation", jobRecommendationSchema);
