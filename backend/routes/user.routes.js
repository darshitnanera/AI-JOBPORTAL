import express from "express";
import { authorize, authMiddleware } from "../middleware/authMiddleware.js";
import { getProfile, updateProfile, getResume } from "../controllers/user.controller.js";
import { upload } from "../middleware/uploadMiddleware.js"

const userRouter = express.Router();
userRouter.get("/profile", authMiddleware, getProfile);
userRouter.get("/resume/:id", getResume); // Public route for viewing, or add auth if needed

userRouter.put(
  "/profile",
  authMiddleware,
  authorize("user"),
  upload.single("resume"),
  updateProfile
);

export default userRouter;