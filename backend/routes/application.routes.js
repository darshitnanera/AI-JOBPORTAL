import express from "express";
import { applyJob, getApplicants, getUserApplications } from "../controllers/application.controller.js";
import { authMiddleware, authorize } from "../middleware/authMiddleware.js";

const applicationRouter = express.Router();

applicationRouter.post("/apply/:id", authMiddleware, applyJob);
applicationRouter.get("/user", authMiddleware, getUserApplications); // New route
applicationRouter.get("/:id/applicants", authMiddleware, authorize("admin"), getApplicants);


export default applicationRouter;