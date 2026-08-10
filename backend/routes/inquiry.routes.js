import express from "express";
import { submitInquiry } from "../controllers/inquiry.controller.js";

const router = express.Router();

// Public route to submit an inquiry
router.post("/", submitInquiry);

export default router;
