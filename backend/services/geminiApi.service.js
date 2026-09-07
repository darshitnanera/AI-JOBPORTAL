import { GoogleGenAI } from "@google/genai";

const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is required for Gemini API");
  }

  return new GoogleGenAI({ apiKey });
};

/**
 * Extract structured information from resume text using Gemini API
 * @param {string} resumeText - Raw resume content
 * @returns {Promise<Object>} Extracted resume data with skills, experience, education, projects, certifications
 */
export async function extractResumeData(resumeText) {
  if (!resumeText || typeof resumeText !== "string" || resumeText.trim().length === 0) {
    throw new Error("Resume text is required and must be non-empty");
  }

  const ai = getGeminiClient();

  const prompt = `Extract all professional information from this resume and return it as valid JSON with the following exact structure (use empty arrays for missing sections):

{
  "skills": ["array of skills as strings"],
  "experience": [
    {
      "company": "company name",
      "role": "job title",
      "duration": "e.g. 2020-2023 or Jan 2020 - Present",
      "description": "brief description of responsibilities and achievements"
    }
  ],
  "education": [
    {
      "school": "institution name",
      "degree": "degree type",
      "field": "field of study",
      "year": "graduation year"
    }
  ],
  "projects": [
    {
      "name": "project name",
      "description": "what you built and why",
      "tech": ["technologies used"]
    }
  ],
  "certifications": [
    {
      "name": "certification name",
      "issuer": "issuing organization",
      "date": "issue date or year"
    }
  ],
  "contact": {
    "email": "email address",
    "phone": "phone number",
    "location": "city, country or region",
    "linkedin": "linkedin profile url"
  },
  "summary": "professional summary"
}

Resume Text:
${resumeText}

Return ONLY the raw JSON object. Do not include markdown code block formatting (like \`\`\`json).`;

  try {
    const response = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
      contents: prompt,
    });

    const text = response.text;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Failed to extract JSON from Gemini response");
    }

    const data = JSON.parse(jsonMatch[0]);
    return {
      success: true,
      data,
    };
  } catch (error) {
    throw new Error(`Gemini extraction failed: ${error.message}`);
  }
}

export function validateResumeData(data) {
  if (!data || typeof data !== "object") {
    throw new Error("Invalid resume data");
  }

  // Ensure arrays exist
  const skills = Array.isArray(data.skills) ? data.skills.map(s => String(s).trim()).filter(Boolean) : [];
  
  const experience = Array.isArray(data.experience) 
    ? data.experience.map(exp => ({
        company: String(exp.company || "").trim(),
        role: String(exp.role || "").trim(),
        duration: String(exp.duration || "").trim(),
        description: String(exp.description || "").trim()
      })).filter(exp => exp.company || exp.role)
    : [];

  const education = Array.isArray(data.education)
    ? data.education.map(edu => ({
        school: String(edu.school || "").trim(),
        degree: String(edu.degree || "").trim(),
        field: String(edu.field || "").trim(),
        year: String(edu.year || "").trim()
      })).filter(edu => edu.school)
    : [];

  const projects = Array.isArray(data.projects)
    ? data.projects.map(proj => ({
        name: String(proj.name || "").trim(),
        description: String(proj.description || "").trim(),
        tech: Array.isArray(proj.tech) ? proj.tech.map(t => String(t).trim()).filter(Boolean) : []
      })).filter(proj => proj.name)
    : [];

  const certifications = Array.isArray(data.certifications)
    ? data.certifications.map(cert => ({
        name: String(cert.name || "").trim(),
        issuer: String(cert.issuer || "").trim(),
        date: String(cert.date || "").trim()
      })).filter(cert => cert.name)
    : [];

  const contact = {
    email: String(data.contact?.email || "").trim(),
    phone: String(data.contact?.phone || "").trim(),
    location: String(data.contact?.location || "").trim(),
    linkedin: String(data.contact?.linkedin || "").trim()
  };

  const summary = String(data.summary || "").trim();

  return {
    skills,
    experience,
    education,
    projects,
    certifications,
    contact,
    summary
  };
}
