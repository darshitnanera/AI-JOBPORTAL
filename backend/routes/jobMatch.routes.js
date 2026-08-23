import express from "express";
import {
  searchJobsWithMatch,
  getJobMatch,
  getRecommendations,
  batchMatchJobs,
  batchMatchAllCandidates,
  markRecommendationViewed,
  rejectRecommendation,
} from "../controllers/jobMatch.controller.js";
import { authMiddleware, authorize } from "../middleware/authMiddleware.js";

const jobMatchRouter = express.Router();

// Public routes
// GET /api/job-match/search?query=...&limit=20&skip=0
// Search jobs with AI match scores for logged-in candidate
jobMatchRouter.get("/search", authMiddleware, authorize("candidate"), searchJobsWithMatch);

// GET /api/job-match/:jobId/match
// Get detailed match information for a specific job
jobMatchRouter.get("/:jobId/match", authMiddleware, authorize("candidate"), getJobMatch);

// GET /api/job-match/recommendations
// Get personalized job recommendations for the candidate
jobMatchRouter.get(
  "/recommendations",
  authMiddleware,
  authorize("candidate"),
  getRecommendations
);

// PATCH /api/job-match/recommendations/:recId/view
// Mark recommendation as viewed
jobMatchRouter.patch(
  "/recommendations/:recId/view",
  authMiddleware,
  authorize("candidate"),
  markRecommendationViewed
);

// PATCH /api/job-match/recommendations/:recId/reject
// Reject a recommendation
jobMatchRouter.patch(
  "/recommendations/:recId/reject",
  authMiddleware,
  authorize("candidate"),
  rejectRecommendation
);

// Internal/Admin routes for batch matching
// POST /api/job-match/batch-match
// Batch match jobs for a specific candidate (usually called by scheduler)
jobMatchRouter.post("/batch-match", authMiddleware, authorize("admin"), batchMatchJobs);

// POST /api/job-match/batch-match-all
// Batch match all candidates with all jobs (nightly cron job)
jobMatchRouter.post(
  "/batch-match-all",
  authMiddleware,
  authorize("admin"),
  batchMatchAllCandidates
);

export default jobMatchRouter;
