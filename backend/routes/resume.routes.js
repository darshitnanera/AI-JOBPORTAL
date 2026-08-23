import express from "express";
import multer from "multer";
import {
  uploadAndParseResume,
  extractResumeText,
  getParsedResume,
  updateResumeSection,
  generateResumePdfFile,
  getResumePreview,
  getResumeVersions,
  restoreResumeVersion,
  deleteParsedResume,
} from "../controllers/resume.controller.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      "application/pdf",
      "text/plain",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/msword",
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only PDF, TXT, and DOCX files are allowed."));
    }
  },
});

// All routes require authentication
router.use(verifyToken);

/**
 * POST /api/resume/upload
 * Upload resume file (PDF, TXT, DOCX) and parse it with Claude API
 * Returns: parsedResume object with extracted sections
 */
router.post("/upload", upload.single("resume"), uploadAndParseResume);

/**
 * POST /api/resume/extract
 * Extract resume data from raw text content
 * Body: { resumeText: string }
 * Returns: parsed resume data
 */
router.post("/extract", extractResumeText);

/**
 * GET /api/resume/parsed
 * Get the current parsed resume for the authenticated user
 * Returns: parsedResume object
 */
router.get("/parsed", getParsedResume);

/**
 * PUT /api/resume/update
 * Update a specific section of the parsed resume
 * Body: { section: string, data: any }
 * Valid sections: skills, experience, education, projects, certifications, contact, summary
 * Returns: updated parsedResume object
 */
router.put("/update", updateResumeSection);

/**
 * POST /api/resume/generate-pdf
 * Generate a professional PDF from the parsed resume
 * Returns: PDF file (application/pdf)
 */
router.post("/generate-pdf", generateResumePdfFile);

/**
 * GET /api/resume/preview
 * Get HTML preview of the resume
 * Returns: HTML content
 */
router.get("/preview", getResumePreview);

/**
 * GET /api/resume/versions
 * Get resume version history
 * Returns: array of versions with metadata
 */
router.get("/versions", getResumeVersions);

/**
 * POST /api/resume/restore-version
 * Restore a previous resume version
 * Body: { version: number }
 * Returns: restored parsedResume object
 */
router.post("/restore-version", restoreResumeVersion);

/**
 * DELETE /api/resume/parsed
 * Delete the parsed resume and all versions
 * Returns: success message
 */
router.delete("/parsed", deleteParsedResume);

export default router;
