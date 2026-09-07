import express from "express";
import { sendMessage } from "../controllers/chatbot.controller.js";

const chatbotRouter = express.Router();

// Public endpoint — no auth required so any visitor can use the chatbot
chatbotRouter.post("/message", sendMessage);

export default chatbotRouter;
