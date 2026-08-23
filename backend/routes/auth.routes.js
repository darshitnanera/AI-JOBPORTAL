import express from "express";
import { register, login, verifyEmail, forgotPassword, resetPassword, completeProfile } from "../controllers/auth.controller.js";

const authRouter = express.Router();

authRouter.post("/register", register);
authRouter.post("/verify-email", verifyEmail);
authRouter.post("/login", login);
authRouter.post("/forgot-password", forgotPassword);
authRouter.post("/reset-password", resetPassword);
authRouter.post("/profile-completion", completeProfile);

export default authRouter;