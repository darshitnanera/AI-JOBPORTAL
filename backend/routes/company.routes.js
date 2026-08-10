import express from "express";
import { authMiddleware, authorize } from "../middleware/authMiddleware.js";
import { upload } from "../middleware/uploadMiddleware.js";
import {
  getCompanies,
  addCompany,
  deleteCompany,
} from "../controllers/company.controller.js";

const companyRouter = express.Router();

//  Public route
companyRouter.get("/", getCompanies);

// Protected (ONLY admin)
companyRouter.post(
  "/",
  authMiddleware,
  authorize("admin"),
  upload.single("logo"),
  addCompany,
);


companyRouter.delete("/:id", authMiddleware, authorize("admin"), deleteCompany);

export default companyRouter;
