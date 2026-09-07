import { PDFParse } from "pdf-parse";
import { extractResumeData, validateResumeData } from "./claudeApi.service.js";

/**
 * Extract text from PDF buffer
 * @param {Buffer} pdfBuffer - PDF file buffer
 * @returns {Promise<string>} Extracted text from PDF
 */
export async function extractTextFromPDF(pdfBuffer) {
  try {
    const parser = new PDFParse({ data: pdfBuffer });
    const pdfData = await parser.getText();
    return pdfData.text || "";
  } catch (error) {
    throw new Error(`Failed to parse PDF: ${error.message}`);
  }
}

/**
 * Parse resume from file buffer (supports PDF, TXT, and other text formats)
 * @param {Buffer} fileBuffer - File buffer
 * @param {string} mimeType - File MIME type
 * @returns {Promise<string>} Extracted text from file
 */
export async function extractTextFromFile(fileBuffer, mimeType) {
  if (!fileBuffer) {
    throw new Error("File buffer is required");
  }

  // Handle PDF files
  if (mimeType === "application/pdf" || mimeType?.includes("pdf")) {
    return extractTextFromPDF(fileBuffer);
  }

  // Handle text files
  if (
    mimeType === "text/plain" ||
    mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    mimeType?.includes("text") ||
    mimeType?.includes("word")
  ) {
    // For text files, assume UTF-8 encoding
    return fileBuffer.toString("utf-8");
  }

  // Default: try to decode as UTF-8
  return fileBuffer.toString("utf-8");
}

/**
 * Parse resume and extract structured data
 * @param {Buffer} fileBuffer - File buffer
 * @param {string} mimeType - File MIME type
 * @returns {Promise<Object>} Parsed resume data
 */
export async function parseResume(fileBuffer, mimeType) {
  try {
    // Extract text from file
    const resumeText = await extractTextFromFile(fileBuffer, mimeType);

    if (!resumeText || resumeText.trim().length === 0) {
      throw new Error("No text content found in the resume file");
    }

    // Extract structured data using Claude API
    const extractedData = await extractResumeData(resumeText);

    // Validate and clean the data
    const validatedData = await validateResumeData(extractedData.data);

    return {
      success: true,
      parsedData: validatedData,
      rawText: resumeText,
    };
  } catch (error) {
    throw new Error(`Resume parsing error: ${error.message}`);
  }
}

/**
 * Parse resume from text content directly
 * @param {string} resumeText - Resume text content
 * @returns {Promise<Object>} Parsed resume data
 */
export async function parseResumeText(resumeText) {
  try {
    if (!resumeText || typeof resumeText !== "string" || resumeText.trim().length === 0) {
      throw new Error("Resume text is required and must be non-empty");
    }

    // Extract structured data using Claude API
    const extractedData = await extractResumeData(resumeText);

    // Validate and clean the data
    const validatedData = await validateResumeData(extractedData.data);

    return {
      success: true,
      parsedData: validatedData,
      rawText: resumeText,
    };
  } catch (error) {
    throw new Error(`Resume parsing error: ${error.message}`);
  }
}

/**
 * Update a specific section of parsed resume
 * @param {Object} currentParsedResume - Current parsed resume data
 * @param {string} section - Section to update (skills, experience, education, etc.)
 * @param {any} data - New data for the section
 * @returns {Object} Updated parsed resume data
 */
export function updateResumSection(currentParsedResume, section, data) {
  const validSections = ["skills", "experience", "education", "projects", "certifications", "contact", "summary"];

  if (!validSections.includes(section)) {
    throw new Error(`Invalid section: ${section}`);
  }

  const updated = { ...currentParsedResume };
  updated[section] = data;

  return updated;
}

/**
 * Merge two resume objects (useful for combining extracted data with user edits)
 * @param {Object} original - Original parsed resume
 * @param {Object} updates - User-made updates
 * @returns {Object} Merged resume data
 */
export function mergeResumeData(original, updates) {
  return {
    skills: Array.isArray(updates.skills) ? updates.skills : original.skills || [],
    experience: Array.isArray(updates.experience) ? updates.experience : original.experience || [],
    education: Array.isArray(updates.education) ? updates.education : original.education || [],
    projects: Array.isArray(updates.projects) ? updates.projects : original.projects || [],
    certifications: Array.isArray(updates.certifications) ? updates.certifications : original.certifications || [],
    contact: typeof updates.contact === "object" ? updates.contact : original.contact || {},
    summary: typeof updates.summary === "string" ? updates.summary : original.summary || "",
  };
}
