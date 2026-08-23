import express from "express";
import {
  sendMessage,
  getChatHistory,
  getConversations,
  getUnreadCount,
  markAsRead,
  markChatAsRead,
  startChat,
  deleteMessage
} from "../controllers/message.controller.js";
import { authenticateToken } from "../middleware/authMiddleware.js";

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Send message
router.post("/send", sendMessage);

// Start new chat
router.post("/start-chat", startChat);

// Get all conversations
router.get("/list", getConversations);

// Get unread count
router.get("/unread-count", getUnreadCount);

// Get chat history with specific user
router.get("/chat/:userId", getChatHistory);

// Mark message as read
router.put("/:messageId/read", markAsRead);

// Mark all messages in chat as read
router.put("/chat/:chatId/read", markChatAsRead);

// Delete message
router.delete("/:messageId", deleteMessage);

export default router;
