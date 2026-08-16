import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { upload } from "../middleware/uploadMiddleware.js";
import {
  generateInterviewReportController,
  getInterviewReportByIdController,
  getAllInterviewReportsController,
  generateResumePdfController,
} from "../controllers/aiSuggestion.controller.js";

const aiSuggestionRouter = express.Router();

aiSuggestionRouter.post("/", authMiddleware, upload.single("resume"), generateInterviewReportController);
aiSuggestionRouter.get("/report/:interviewId", authMiddleware, getInterviewReportByIdController);
aiSuggestionRouter.get("/", authMiddleware, getAllInterviewReportsController);
aiSuggestionRouter.post("/resume/pdf/:interviewReportId", authMiddleware, generateResumePdfController);

export default aiSuggestionRouter;