import User from "../models/user.model.js";
import { parseResume, parseResumeText, updateResumSection, mergeResumeData } from "../services/resumeParser.service.js";
import { generateResumePDF, generateResumeHTML_Export, updateAndRegeneratePDF } from "../services/resumeGenerator.service.js";
import { uploadToCloudinary } from "../utils/cloudinaryUpload.js";
import cloudinary from "../config/cloudinary.js";

/**
 * POST /api/resume/upload
 * Upload and parse resume file (PDF, TXT, DOCX)
 */
export const uploadAndParseResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    // Parse resume using Claude API
    const { parsedData, rawText } = await parseResume(req.file.buffer, req.file.mimetype);

    // Save original file to Cloudinary
    const sanitizedFileName = req.file.originalname
      .replace(/\.[^/.]+$/, "")
      .replace(/\s+/g, "_")
      .replace(/[^a-zA-Z0-9\-_]/g, "") + ".pdf";

    const uploadResult = await uploadToCloudinary(req.file.buffer, "jobportal/resumes", "raw", sanitizedFileName);

    // Get current user
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Create resume version
    const version = (user.resumeVersions?.length || 0) + 1;

    // Update user with parsed resume data
    user.parsedResume = parsedData;
    user.resume = uploadResult.secure_url;
    user.resumePublicId = uploadResult.public_id;

    // Store in resume versions for history tracking
    user.resumeVersions.push({
      version,
      parsedData: parsedData,
      createdAt: new Date(),
      notes: "Uploaded and parsed resume",
    });

    await user.save();

    res.status(200).json({
      success: true,
      message: "Resume uploaded and parsed successfully",
      parsedResume: parsedData,
      resumeUrl: uploadResult.secure_url,
      version,
    });
  } catch (error) {
    console.error("Resume upload error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to upload and parse resume",
    });
  }
};

/**
 * POST /api/resume/extract
 * Extract data from resume text
 */
export const extractResumeText = async (req, res) => {
  try {
    const { resumeText } = req.body;

    if (!resumeText) {
      return res.status(400).json({
        success: false,
        message: "Resume text is required",
      });
    }

    const { parsedData, rawText } = await parseResumeText(resumeText);

    res.status(200).json({
      success: true,
      message: "Resume text extracted successfully",
      parsedResume: parsedData,
    });
  } catch (error) {
    console.error("Resume extraction error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to extract resume text",
    });
  }
};

/**
 * GET /api/resume/parsed
 * Get parsed resume for current user
 */
export const getParsedResume = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("parsedResume name email phone");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (!user.parsedResume) {
      return res.status(404).json({
        success: false,
        message: "No parsed resume found",
      });
    }

    res.status(200).json({
      success: true,
      parsedResume: user.parsedResume,
      userInfo: {
        name: user.name,
        email: user.email,
        phone: user.phone,
      },
    });
  } catch (error) {
    console.error("Error fetching parsed resume:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch parsed resume",
    });
  }
};

/**
 * PUT /api/resume/update
 * Update specific resume section
 */
export const updateResumeSection = async (req, res) => {
  try {
    const { section, data } = req.body;

    if (!section || !data) {
      return res.status(400).json({
        success: false,
        message: "Section and data are required",
      });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (!user.parsedResume) {
      return res.status(404).json({
        success: false,
        message: "No parsed resume found to update",
      });
    }

    // Update the section
    const updatedResume = updateResumSection(user.parsedResume, section, data);

    // Save updated resume
    user.parsedResume = updatedResume;

    // Save new version
    const version = (user.resumeVersions?.length || 0) + 1;
    user.resumeVersions.push({
      version,
      parsedData: updatedResume,
      createdAt: new Date(),
      notes: `Updated ${section}`,
    });

    await user.save();

    res.status(200).json({
      success: true,
      message: `${section} updated successfully`,
      parsedResume: updatedResume,
      version,
    });
  } catch (error) {
    console.error("Resume section update error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to update resume section",
    });
  }
};

/**
 * POST /api/resume/generate-pdf
 * Generate PDF from parsed resume
 */
export const generateResumePdfFile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("name parsedResume");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (!user.parsedResume) {
      return res.status(404).json({
        success: false,
        message: "No parsed resume found",
      });
    }

    const pdfBuffer = await generateResumePDF(user.parsedResume, user.name);

    // Set response headers for PDF download
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${user.name.replace(/\s+/g, "_")}_Resume.pdf"`);
    res.setHeader("Content-Length", pdfBuffer.length);

    res.send(pdfBuffer);
  } catch (error) {
    console.error("PDF generation error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to generate resume PDF",
    });
  }
};

/**
 * GET /api/resume/preview
 * Get HTML preview of resume
 */
export const getResumePreview = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("name parsedResume");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (!user.parsedResume) {
      return res.status(404).json({
        success: false,
        message: "No parsed resume found",
      });
    }

    const htmlContent = generateResumeHTML_Export(user.parsedResume, user.name);

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(htmlContent);
  } catch (error) {
    console.error("Resume preview error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to generate resume preview",
    });
  }
};

/**
 * GET /api/resume/versions
 * Get resume version history
 */
export const getResumeVersions = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("resumeVersions");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Return versions sorted by date (newest first)
    const versions = (user.resumeVersions || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.status(200).json({
      success: true,
      versions: versions.map((v) => ({
        version: v.version,
        createdAt: v.createdAt,
        notes: v.notes,
      })),
    });
  } catch (error) {
    console.error("Error fetching version history:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch version history",
    });
  }
};

/**
 * POST /api/resume/restore-version
 * Restore a previous resume version
 */
export const restoreResumeVersion = async (req, res) => {
  try {
    const { version } = req.body;

    if (!version) {
      return res.status(400).json({
        success: false,
        message: "Version number is required",
      });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const versionRecord = (user.resumeVersions || []).find((v) => v.version === version);

    if (!versionRecord) {
      return res.status(404).json({
        success: false,
        message: `Version ${version} not found`,
      });
    }

    // Restore the version
    user.parsedResume = versionRecord.parsedData;

    // Create new version entry for the restoration
    const newVersion = (user.resumeVersions?.length || 0) + 1;
    user.resumeVersions.push({
      version: newVersion,
      parsedData: versionRecord.parsedData,
      createdAt: new Date(),
      notes: `Restored from version ${version}`,
    });

    await user.save();

    res.status(200).json({
      success: true,
      message: `Restored to version ${version}`,
      parsedResume: user.parsedResume,
      newVersion,
    });
  } catch (error) {
    console.error("Version restore error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to restore resume version",
    });
  }
};

/**
 * DELETE /api/resume/parsed
 * Delete parsed resume data
 */
export const deleteParsedResume = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Delete from Cloudinary if exists
    if (user.resumePublicId) {
      try {
        await cloudinary.uploader.destroy(user.resumePublicId, { resource_type: "raw" });
      } catch (err) {
        console.warn("Could not delete file from Cloudinary:", err.message);
      }
    }

    // Clear parsed resume data
    user.parsedResume = null;
    user.resume = "";
    user.resumePublicId = "";
    user.resumeVersions = [];

    await user.save();

    res.status(200).json({
      success: true,
      message: "Resume deleted successfully",
    });
  } catch (error) {
    console.error("Resume delete error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to delete resume",
    });
  }
};
