import { createRequire } from "node:module";
import InterviewReport from "../models/interviewReport.model.js";
import {
  generateInterviewReport,
  generateResumePdf,
} from "../services/aiSuggestion.service.js";

const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");

export const generateInterviewReportController = async (req, res) => {
  try {
    const { jobDescription, selfDescription } = req.body;

    if (!jobDescription || (!selfDescription && !req.file)) {
      return res.status(400).json({
        success: false,
        message: "Job description and either a resume or self description are required.",
      });
    }

    let resumeText = "";
    if (req.file) {
      const parsed = await pdfParse(req.file.buffer);
      resumeText = parsed.text || "";
    }

    const aiReport = await generateInterviewReport({
      resume: resumeText,
      selfDescription: selfDescription || "",
      jobDescription,
    });

    const interviewReport = await InterviewReport.create({
      user: req.user.id,
      resume: resumeText,
      selfDescription: selfDescription || "",
      jobDescription,
      ...aiReport,
    });

    return res.status(201).json({
      success: true,
      message: "Interview report generated successfully.",
      interviewReport,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getInterviewReportByIdController = async (req, res) => {
  try {
    const { interviewId } = req.params;
    const interviewReport = await InterviewReport.findOne({
      _id: interviewId,
      user: req.user.id,
    });

    if (!interviewReport) {
      return res.status(404).json({
        success: false,
        message: "Interview report not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Interview report fetched successfully.",
      interviewReport,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getAllInterviewReportsController = async (req, res) => {
  try {
    const interviewReports = await InterviewReport.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .select("-resume -selfDescription -jobDescription -__v");

    return res.status(200).json({
      success: true,
      message: "Interview reports fetched successfully.",
      interviewReports,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const generateResumePdfController = async (req, res) => {
  try {
    const { interviewReportId } = req.params;

    const interviewReport = await InterviewReport.findOne({
      _id: interviewReportId,
      user: req.user.id,
    });

    if (!interviewReport) {
      return res.status(404).json({
        success: false,
        message: "Interview report not found.",
      });
    }

    const pdfBuffer = await generateResumePdf({
      resume: interviewReport.resume,
      jobDescription: interviewReport.jobDescription,
      selfDescription: interviewReport.selfDescription,
    });

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename=resume_${interviewReportId}.pdf`,
    });

    return res.send(pdfBuffer);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};