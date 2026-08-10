import express from "express";
import { authMiddleware, authorize } from "../middleware/authMiddleware.js";
import { upload } from "../middleware/uploadMiddleware.js";
import {
    addInterviewCompany,
    getInterviewCompanies,
    getInterviewQuestionsByCompany,
    updateInterviewCompany,
    deleteInterviewCompany,
    addInterviewRole,
    getInterviewRoles,
    getQuestionsByRole,
    updateInterviewRole,
    deleteInterviewRole,
} from "../controllers/interview.controller.js";

const interviewRouter = express.Router();

// --- Role based interview routes (Move specific routes above parametric ones) ---
interviewRouter.get("/roles", getInterviewRoles);
interviewRouter.get("/role/:roleId", getQuestionsByRole);

interviewRouter.post(
    "/role",
    authMiddleware,
    authorize("admin"),
    upload.fields([
        { name: "imageFile", maxCount: 1 },
        { name: "csvFile", maxCount: 1 },
    ]),
    addInterviewRole
);

interviewRouter.put(
    "/role/:roleId",
    authMiddleware,
    authorize("admin"),
    upload.fields([
        { name: "imageFile", maxCount: 1 },
        { name: "csvFile", maxCount: 1 },
    ]),
    updateInterviewRole
);

interviewRouter.delete(
    "/role/:roleId",
    authMiddleware,
    authorize("admin"),
    deleteInterviewRole
);

// --- Company based interview routes ---

// Public: Get all Interview Companies
interviewRouter.get("/companies", getInterviewCompanies);

// Public: Get Questions by Company ID
interviewRouter.get("/company/:companyId", getInterviewQuestionsByCompany);

// Admin: Add Company and Questions
interviewRouter.post(
    "/",
    authMiddleware,
    authorize("admin"),
    upload.fields([
        { name: "logoFile", maxCount: 1 },
        { name: "csvFile", maxCount: 1 },
    ]),
    addInterviewCompany
);

// Admin: Update Company and Questions
interviewRouter.put(
    "/:companyId",
    authMiddleware,
    authorize("admin"),
    upload.fields([
        { name: "logoFile", maxCount: 1 },
        { name: "csvFile", maxCount: 1 },
    ]),
    updateInterviewCompany
);

// Admin: Delete Company and its Questions
interviewRouter.delete(
    "/:companyId",
    authMiddleware,
    authorize("admin"),
    deleteInterviewCompany
);

export default interviewRouter;
