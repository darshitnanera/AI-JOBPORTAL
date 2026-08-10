import express from "express";
import { toggleSaveJob, toggleSaveQuestion, getSavedItems } from "../controllers/saved.controller.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/", getSavedItems);
router.post("/job/:jobId", toggleSaveJob);
router.post("/question/:questionId", toggleSaveQuestion);

export default router;