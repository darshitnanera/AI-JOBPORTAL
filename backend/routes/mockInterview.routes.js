import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import {
  createMockQuestion,
  getMockQuestions,
  updateMockQuestion,
  deleteMockQuestion,
  getMockInterviewOptions,
  getMockInterviewSession,
  submitMockInterview,
  getMockInterviewAttempts,
  getExamResults,
} from "../controllers/mockInterview.controller.js";

const mockInterviewRouter = express.Router();

/**
 * Recruiter guard.
 *
 * `authorize("recruiter")` only inspects `req.user.role`, but this app carries
 * the same fact on two fields — `role` and `userType` — and signup/login can
 * leave a recruiter with `role: "user"` while `userType` is "recruiter".
 * Accepting either keeps every real recruiter in and every candidate out.
 */
const requireRecruiter = (req, res, next) => {
  const isRecruiter =
    req.user?.role === "recruiter" || req.user?.userType === "recruiter";
  if (!isRecruiter) {
    return res.status(403).json({
      success: false,
      message: "Access denied. Recruiter account required",
    });
  }
  next();
};

// Every mock-interview route is authenticated.
mockInterviewRouter.use(authMiddleware);

// ─── Recruiter: question bank ───────────────────────────────────────────────
mockInterviewRouter.post("/questions", requireRecruiter, createMockQuestion);
mockInterviewRouter.get("/questions", requireRecruiter, getMockQuestions);
mockInterviewRouter.put("/questions/:id", requireRecruiter, updateMockQuestion);
mockInterviewRouter.delete("/questions/:id", requireRecruiter, deleteMockQuestion);

// ─── Candidate: practice engine ─────────────────────────────────────────────
mockInterviewRouter.get("/options", getMockInterviewOptions);
mockInterviewRouter.get("/session", getMockInterviewSession);
mockInterviewRouter.post("/submit", submitMockInterview);
mockInterviewRouter.get("/attempts", getMockInterviewAttempts);

/**
 * Dashboard score sync.
 *
 * Mounted separately at `/api/exam` so it answers `GET /api/exam/results`,
 * the path the Candidate Dashboard already polls for assessment history.
 */
export const examResultsRouter = express.Router();
examResultsRouter.use(authMiddleware);
examResultsRouter.get("/results", getExamResults);

export default mockInterviewRouter;
