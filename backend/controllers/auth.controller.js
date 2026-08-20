import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import {
    hasEmailConfiguration,
    sendVerificationEmail,
    sendForgotPasswordEmail,
} from "../utils/emailService.js";

const ensureDatabaseReady = (res) => {
    if (mongoose.connection.readyState !== 1) {
        res.status(503).json({
            success: false,
            message: "Database is not configured. Set MONGO_URI in backend/.env and restart the server.",
        });
        return false;
    }

    return true;
};

export const register = async (req, res) => {
    try {
        if (!ensureDatabaseReady(res)) return;

        const { name, email, password, role } = req.body;

        const userExist = await User.findOne({ email });

        if (userExist) {
            return res.status(400).json({
                success: false,
                message: "User already exists",
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        let userRole = "user";
        if (role) {
            const normalized = role.toLowerCase().trim();
            if (normalized === "recruiter") userRole = "recruiter";
            else if (normalized === "candidate" || normalized === "user") userRole = "user";
            else if (normalized === "admin") userRole = "admin";
        }

        // Generate 6-digit OTP
        const verificationOTP = Math.floor(100000 + Math.random() * 900000).toString();
        const verificationOTPExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            role: userRole,
            verificationOTP,
            verificationOTPExpires
        });

        // In development without email credentials, auto-verify so sign-up can work end-to-end.
        if (hasEmailConfiguration()) {
            try {
                await sendVerificationEmail(email, name, verificationOTP);
            } catch (error) {
                console.error("Failed to send verification email:", error);
            }
        } else {
            user.isVerified = true;
            user.verificationOTP = undefined;
            user.verificationOTPExpires = undefined;
            await user.save();
        }

        res.status(201).json({
            success: true,
            message: hasEmailConfiguration()
                ? "Account created successfully. Please check your email for the 6-digit verification code."
                : "Account created successfully.",
            user: {
                name: user.name,
                email: user.email,
                role: user.role,
                isVerified: user.isVerified
            }
        });

    }
    catch (err) {
        res.status(500).json({
            success: false,
            message: err.message,
        })
    }
}

export const login = async (req, res) => {
    try {
        if (!ensureDatabaseReady(res)) return;

        const { email, password, role } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({
                success: false,
                message: "Invalid email or Password",
            })
        }

        if (!user.isVerified) {
            return res.status(401).json({
                success: false,
                message: "Please verify your email address before logging in",
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: "Invalid email or password",
            })
        }

        // If user logged in via recruiter tab, ensure recruiter role is assigned
        if (role) {
            const normalized = role.toLowerCase().trim();
            if (normalized === "recruiter" && user.role !== "admin" && user.role !== "recruiter") {
                user.role = "recruiter";
                await user.save();
            } else if ((normalized === "candidate" || normalized === "user") && user.role === "recruiter") {
                // If they explicitly logged in as candidate, switch or retain
                user.role = "user";
                await user.save();
            }
        }

        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "7d" })

        res.status(200).json({
            success: true,
            message: `Login successful as ${user.role === "recruiter" ? "Recruiter" : user.role === "admin" ? "Admin" : "Candidate"}`,
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message,
        })
    }
}

export const verifyEmail = async (req, res) => {
    try {
        if (!ensureDatabaseReady(res)) return;

        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({
                success: false,
                message: "Email and OTP are required",
            });
        }

        const user = await User.findOne({
            email,
            verificationOTP: otp,
            verificationOTPExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: "Invalid or expired OTP",
            });
        }

        user.isVerified = true;
        user.verificationOTP = undefined;
        user.verificationOTPExpires = undefined;
        await user.save();

        res.status(200).json({
            success: true,
            message: "Email verified successfully. You can now log in.",
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message,
        });
    }
}

export const forgotPassword = async (req, res) => {
    try {
        if (!ensureDatabaseReady(res)) return;

        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ success: false, message: "Email is required" });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ success: false, message: "User with this email not found" });
        }

        const resetOTP = Math.floor(100000 + Math.random() * 900000).toString();
        const resetOTPExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

        user.resetPasswordOTP = resetOTP;
        user.resetPasswordOTPExpires = resetOTPExpires;
        await user.save();

        try {
            await sendForgotPasswordEmail(email, user.name, resetOTP);
        } catch (error) {
            console.error("Failed to send reset email:", error);
        }

        res.status(200).json({
            success: true,
            message: "Password reset OTP sent to your email.",
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
}

export const resetPassword = async (req, res) => {
    try {
        if (!ensureDatabaseReady(res)) return;

        const { email, otp, newPassword } = req.body;

        if (!email || !otp || !newPassword) {
            return res.status(400).json({ success: false, message: "Email, OTP and new password are required" });
        }

        const user = await User.findOne({
            email,
            resetPasswordOTP: otp,
            resetPasswordOTPExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ success: false, message: "Invalid or expired OTP" });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        user.resetPasswordOTP = undefined;
        user.resetPasswordOTPExpires = undefined;
        await user.save();

        res.status(200).json({
            success: true,
            message: "Password reset successful. You can now log in with your new password.",
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
}