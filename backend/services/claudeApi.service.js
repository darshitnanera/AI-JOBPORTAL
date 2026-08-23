import Anthropic from "@anthropic-ai/sdk";

const getClaudeClient = () => {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is required for Claude API");
  }

  return new Anthropic({
    apiKey,
  });
};

/**
 * Extract structured information from resume text using Claude API
 * @param {string} resumeText - Raw resume content
 * @returns {Promise<Object>} Extracted resume data with skills, experience, education, projects, certifications
 */
export async function extractResumeData(resumeText) {
  if (!resumeText || typeof resumeText !== "string" || resumeText.trim().length === 0) {
    throw new Error("Resume text is required and must be non-empty");
  }

  const client = getClaudeClient();

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
      "date": "date obtained"
    }
  ],
  "contact": {
    "email": "email address if present",
    "phone": "phone number if present",
    "location": "location if present",
    "linkedin": "LinkedIn URL if present"
  },
  "summary": "professional summary or objective if present"
}

Resume content:
${resumeText}

Return ONLY valid JSON, no other text.`;

  try {
    const response = await client.messages.create({
      model: "claude-opus-5",
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    // Extract text from response
    const responseText = response.content[0].type === "text" ? response.content[0].text : "";

    // Parse JSON response
    const parsedData = JSON.parse(responseText);

    return {
      success: true,
      data: parsedData,
      rawText: resumeText,
    };
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(`Failed to parse Claude response as JSON: ${error.message}`);
    }
    throw new Error(`Claude API error: ${error.message}`);
  }
}

/**
 * Generate a professional resume summary based on extracted data
 * @param {Object} resumeData - Extracted resume data
 * @returns {Promise<string>} Professional summary
 */
export async function generateResumeSummary(resumeData) {
  const client = getClaudeClient();

  const prompt = `Based on the following resume data, generate a professional 2-3 sentence summary that highlights key strengths and career focus:

Skills: ${(resumeData.skills || []).slice(0, 10).join(", ")}
Experience: ${(resumeData.experience || [])
    .slice(0, 2)
    .map((e) => `${e.role} at ${e.company}`)
    .join(", ")}
Education: ${(resumeData.education || [])
    .map((e) => `${e.degree} in ${e.field}`)
    .join(", ")}

Generate a concise, professional summary (2-3 sentences):`;

  try {
    const response = await client.messages.create({
      model: "claude-opus-5",
      max_tokens: 500,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    return response.content[0].type === "text" ? response.content[0].text : "";
  } catch (error) {
    console.error("Error generating resume summary:", error.message);
    return "";
  }
}

/**
 * Validate and enhance resume data
 * @param {Object} resumeData - Extracted resume data
 * @returns {Promise<Object>} Validated and enhanced resume data
 */
export async function validateResumeData(resumeData) {
  // Basic validation
  const validated = {
    skills: Array.isArray(resumeData.skills) ? resumeData.skills.filter((s) => s && typeof s === "string") : [],
    experience: Array.isArray(resumeData.experience)
      ? resumeData.experience.filter((e) => e && typeof e === "object" && e.company && e.role)
      : [],
    education: Array.isArray(resumeData.education)
      ? resumeData.education.filter((e) => e && typeof e === "object" && e.school && e.degree)
      : [],
    projects: Array.isArray(resumeData.projects)
      ? resumeData.projects.filter((p) => p && typeof p === "object" && p.name)
      : [],
    certifications: Array.isArray(resumeData.certifications)
      ? resumeData.certifications.filter((c) => c && typeof c === "object" && c.name)
      : [],
    contact: resumeData.contact && typeof resumeData.contact === "object" ? resumeData.contact : {},
    summary: typeof resumeData.summary === "string" ? resumeData.summary : "",
  };

  return validated;
}
