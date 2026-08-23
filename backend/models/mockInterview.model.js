import mongoose from "mongoose";

/**
 * Mock Interview module — two collections.
 *
 *  MockQuestion         a recruiter-authored question in the practice bank.
 *  MockInterviewAttempt a candidate's completed practice run, with the
 *                       server-computed per-answer breakdown.
 *
 * These are deliberately separate from the admin-owned `InterviewCompany` /
 * `InterviewRole` / `RoleQuestion` collections: those model a curated,
 * admin-published question library keyed by ObjectId. The mock-interview bank
 * is recruiter-owned and keyed by free-text company/role strings, so any
 * recruiter can publish practice material without an admin first creating a
 * company or role document.
 */

export const QUESTION_CATEGORIES = [
  "Technical",
  "HR",
  "System Design",
  "Behavioural",
];

export const QUESTION_DIFFICULTIES = ["Easy", "Medium", "Hard"];

const mockQuestionSchema = new mongoose.Schema(
  {
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    companyName: {
      type: String,
      required: true,
      trim: true,
    },
    targetRole: {
      type: String,
      required: true,
      trim: true,
    },
    questionText: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: QUESTION_CATEGORIES,
      default: "Technical",
    },
    difficulty: {
      type: String,
      enum: QUESTION_DIFFICULTIES,
      default: "Medium",
    },
    modelAnswer: {
      type: String,
      default: "",
      trim: true,
    },
    // Scoring is driven entirely by these — a question without key points
    // could never be graded, so at least one is required.
    keyPoints: {
      type: [String],
      required: true,
      validate: {
        validator: (points) =>
          Array.isArray(points) &&
          points.filter((p) => typeof p === "string" && p.trim()).length > 0,
        message: "At least one key point is required for scoring",
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// The candidate-facing `/options` and `/session` lookups always filter on this
// exact triple.
mockQuestionSchema.index({ isActive: 1, companyName: 1, targetRole: 1 });

const attemptAnswerSchema = new mongoose.Schema(
  {
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MockQuestion",
    },
    questionText: { type: String, default: "" },
    response: { type: String, default: "" },
    score: { type: Number, default: 0, min: 0, max: 100 },
    matchedKeyPoints: { type: [String], default: [] },
    missingKeyPoints: { type: [String], default: [] },
    feedback: { type: String, default: "" },
  },
  { _id: false }
);

const mockInterviewAttemptSchema = new mongoose.Schema(
  {
    candidateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    companyName: { type: String, required: true, trim: true },
    targetRole: { type: String, required: true, trim: true },
    answers: { type: [attemptAnswerSchema], default: [] },
    overallScore: { type: Number, default: 0, min: 0, max: 100 },
    totalQuestions: { type: Number, default: 0 },
    durationSeconds: { type: Number, default: 0 },
    completedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// The dashboard reads the most recent attempts first.
mockInterviewAttemptSchema.index({ candidateId: 1, completedAt: -1 });

export const MockQuestion =
  mongoose.models.MockQuestion ||
  mongoose.model("MockQuestion", mockQuestionSchema);

export const MockInterviewAttempt =
  mongoose.models.MockInterviewAttempt ||
  mongoose.model("MockInterviewAttempt", mockInterviewAttemptSchema);

export default { MockQuestion, MockInterviewAttempt };
