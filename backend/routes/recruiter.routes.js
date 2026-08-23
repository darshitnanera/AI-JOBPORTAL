import express from "express";
import {
    createJobPosting,
    getRecruiterJobs,
    updateJobStatus,
    deleteRecruiterJob,
    getRecruiterApplications,
    updateApplicationStatus,
    bulkUpdateApplicationStatus,
    getRecruiterDashboardStats,
    getRecentApplications,
} from "../controllers/recruiter.controller.js";
import { authMiddleware, authorize } from "../middleware/authMiddleware.js";
import { upload } from "../middleware/uploadMiddleware.js";

const recruiterRouter = express.Router();

// All routes require recruiter authentication
recruiterRouter.use(authMiddleware, authorize("recruiter"));

// Job posting routes
recruiterRouter.post("/jobs/create", upload.single("companyLogo"), createJobPosting);
recruiterRouter.get("/jobs", getRecruiterJobs);
recruiterRouter.put("/jobs/:jobId/status", updateJobStatus);
recruiterRouter.delete("/jobs/:jobId", deleteRecruiterJob);

// Application management routes
recruiterRouter.get("/applications", getRecruiterApplications);
recruiterRouter.put("/applications/:applicationId/status", updateApplicationStatus);
recruiterRouter.put("/applications/bulk/status", bulkUpdateApplicationStatus);

// Dashboard routes
recruiterRouter.get("/dashboard/stats", getRecruiterDashboardStats);
recruiterRouter.get("/dashboard/recent-applications", getRecentApplications);

export default recruiterRouter;
