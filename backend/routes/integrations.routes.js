import express from "express";
import {
  initiateGitHubAuth,
  handleGitHubCallback,
  connectLeetCode,
  connectLinkedIn,
  getUserIntegrations,
  disconnectIntegration,
  getCandidateProfileWithIntegrations,
} from "../controllers/integrations.controller.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const integrationsRouter = express.Router();

// GitHub Integration
integrationsRouter.get("/github/auth", authMiddleware, initiateGitHubAuth);
integrationsRouter.get("/github/callback", authMiddleware, handleGitHubCallback);

// LeetCode Integration
integrationsRouter.post("/leetcode/connect", authMiddleware, connectLeetCode);

// LinkedIn Integration
integrationsRouter.post("/linkedin/connect", authMiddleware, connectLinkedIn);

// Get all integrations for user
integrationsRouter.get("/profile", authMiddleware, getUserIntegrations);

// Disconnect integration
integrationsRouter.post("/disconnect", authMiddleware, disconnectIntegration);

// Get candidate profile with integrations (for recruiters)
integrationsRouter.get("/candidate/:candidateId", authMiddleware, getCandidateProfileWithIntegrations);

export default integrationsRouter;
