import { GoogleGenAI } from "@google/genai";

const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is required for Gemini chatbot");
  }
  return new GoogleGenAI({ apiKey });
};

const SYSTEM_PROMPT = `You are JobBot, an AI career assistant for the AI-JobPortal platform. You help users with:

1. **Job Search & Applications**: Tips on finding jobs, writing cover letters, optimizing applications
2. **Resume & Profile**: Resume writing advice, profile optimization, skill highlighting
3. **Interview Preparation**: Common interview questions, behavioral questions, technical prep
4. **Career Guidance**: Career transitions, skill development, industry trends
5. **Platform Help**: How to use the AI-JobPortal features (job search, resume parsing, mock interviews, messaging)

Guidelines:
- Be friendly, professional, and encouraging
- Give concise but helpful answers (2-4 paragraphs max unless the user asks for detail)
- When giving advice, be specific and actionable
- If asked about something unrelated to careers/jobs, politely redirect
- Use bullet points and formatting for clarity when listing items
- Mention relevant AI-JobPortal features when appropriate (e.g., "You can use our Resume Parser to analyze your resume" or "Try our Mock Interview feature to practice")
- Never share personal data or make claims about specific companies' hiring decisions`;

/**
 * Send a message to Gemini and get a chatbot response
 * @param {string} userMessage - The user's message
 * @param {Array} conversationHistory - Previous messages [{role, content}]
 * @returns {Promise<Object>} The chatbot response
 */
export async function getChatbotResponse(userMessage, conversationHistory = []) {
  if (!userMessage || typeof userMessage !== "string" || userMessage.trim().length === 0) {
    throw new Error("Message is required and must be non-empty");
  }

  const ai = getGeminiClient();

  // Build conversation context from history
  const historyContext = conversationHistory
    .slice(-10) // Keep last 10 messages for context window
    .map((msg) => `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`)
    .join("\n\n");

  const prompt = `${SYSTEM_PROMPT}

${historyContext ? `Previous conversation:\n${historyContext}\n\n` : ""}User: ${userMessage}

Respond helpfully and concisely:`;

  try {
    const response = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
      contents: prompt,
    });

    const text = response.text;

    if (!text) {
      throw new Error("Empty response from Gemini");
    }

    return {
      success: true,
      reply: text.trim(),
    };
  } catch (error) {
    // Handle specific Gemini errors
    if (error.message?.includes("API key")) {
      throw new Error("Chatbot service is not properly configured. Please check the API key.");
    }
    if (error.message?.includes("quota") || error.message?.includes("rate")) {
      throw new Error("Chatbot is temporarily busy. Please try again in a moment.");
    }
    throw new Error(`Chatbot error: ${error.message}`);
  }
}
