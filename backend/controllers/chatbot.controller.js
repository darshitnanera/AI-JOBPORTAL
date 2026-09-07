import { getChatbotResponse } from "../services/chatbot.service.js";

/**
 * POST /api/chatbot/message
 * Send a message to the AI chatbot and get a response
 */
export const sendMessage = async (req, res) => {
  try {
    const { message, history } = req.body;

    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Message is required",
      });
    }

    // Limit message length to prevent abuse
    if (message.length > 2000) {
      return res.status(400).json({
        success: false,
        message: "Message is too long. Please keep it under 2000 characters.",
      });
    }

    // Validate history format if provided
    const conversationHistory = Array.isArray(history)
      ? history
          .filter(
            (msg) =>
              msg &&
              typeof msg === "object" &&
              typeof msg.role === "string" &&
              typeof msg.content === "string"
          )
          .slice(-10) // Keep last 10 messages
      : [];

    const result = await getChatbotResponse(message.trim(), conversationHistory);

    return res.status(200).json({
      success: true,
      reply: result.reply,
    });
  } catch (error) {
    console.error("[Chatbot] Error:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to get chatbot response",
    });
  }
};
