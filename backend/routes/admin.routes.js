import express from "express";
import { authMiddleware, authorize } from "../middleware/authMiddleware.js";
import * as adminController from "../controllers/admin.controller.js";

const router = express.Router();

// All admin routes require authentication and admin role
router.use(authMiddleware);
router.use(authorize("admin"));

// Platform statistics
router.get("/stats", adminController.getPlatformStats);

// User management
router.get("/users", adminController.getAllUsers);
router.put("/users/:userId/status", adminController.toggleUserStatus);
router.put("/users/:userId/verify-recruiter", adminController.verifyRecruiter);
router.delete("/users/:userId", adminController.deleteUser);

// Job management
router.get("/jobs", adminController.getAllJobs);
router.put("/jobs/:jobId/status", adminController.updateJobStatus);
router.delete("/jobs/:jobId", adminController.deleteJob);

// Application management
router.get("/applications", adminController.getAllApplications);
router.put("/applications/:applicationId/status", adminController.updateApplicationStatus);

// Analytics
router.get("/analytics", adminController.getAnalytics);

export default router;
