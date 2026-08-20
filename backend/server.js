import express from "express";
import "dotenv/config";
import cors from "cors";
import { connectDB } from "./config/db.js";

import authRouter from "./routes/auth.routes.js";
import userRouter from "./routes/user.routes.js";
import companyRouter from "./routes/company.routes.js";
import jobRouter from "./routes/job.routes.js";
import interviewRouter from "./routes/interview.routes.js";
import aiSuggestionRouter from "./routes/aiSuggestion.routes.js";
import applicationRouter from "./routes/application.routes.js";
import savedRouter from "./routes/saved.routes.js";
import inquiryRouter from "./routes/inquiry.routes.js";

const PORT = process.env.PORT || 5000;
const app = express();

connectDB();

// Validate important environment variables. In production, fail fast if missing.
const requiredEnv = ["MONGO_URI", "JWT_SECRET"];
const missingEnv = requiredEnv.filter((k) => !process.env[k]);
if (missingEnv.length) {
  if (process.env.NODE_ENV === "production") {
    console.error("Missing required environment variables:", missingEnv.join(", "));
    process.exit(1);
  } else {
    console.warn("Warning - missing environment variables:", missingEnv.join(", "));
  }
}

// ─── CORS ───────────────────────────────────────────────────────────────────
//
// ALWAYS-ALLOWED origins (hard-coded so they work even without env vars set).
// Env vars CLIENT_URL and CORS_ORIGINS are additive extras.
//
const ALWAYS_ALLOWED = [
  "https://jobportal-app-three.vercel.app",
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:3000",
  "http://localhost:5000",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
];

// Merge env-var-based origins (comma-separated) with always-allowed list.
const getAllowedOrigins = () => {
  const extra = [
    ...(process.env.CLIENT_URL || "").split(","),
    ...(process.env.CORS_ORIGINS || "").split(","),
  ]
    .map((s) => s.trim())
    .filter(Boolean);
  // Deduplicate with a Set
  return [...new Set([...ALWAYS_ALLOWED, ...extra])];
};

const ALLOWED_ORIGINS = getAllowedOrigins();
console.log("[CORS] Allowed origins:", ALLOWED_ORIGINS);

const corsOptions = {
  origin: (incomingOrigin, callback) => {
    // Allow server-to-server / Postman / curl (no origin header)
    if (!incomingOrigin) return callback(null, true);

    // Exact match (most reliable — no normalization trickery)
    if (ALLOWED_ORIGINS.includes(incomingOrigin)) {
      return callback(null, true);
    }

    // Match with trailing slash stripped (belt-and-suspenders)
    const stripped = incomingOrigin.replace(/\/+$/, "");
    if (ALLOWED_ORIGINS.some((o) => o.replace(/\/+$/, "") === stripped)) {
      return callback(null, true);
    }

    // Allow ANY *.vercel.app preview URL (Vercel deploys unique URLs per commit)
    if (incomingOrigin.endsWith(".vercel.app")) {
      return callback(null, true);
    }

    console.warn("[CORS] Blocked origin:", incomingOrigin);
    return callback(new Error(`CORS: origin ${incomingOrigin} not allowed`), false);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept", "Origin"],
  exposedHeaders: ["Content-Disposition", "Content-Length"],
  optionsSuccessStatus: 204,
};

// Apply CORS to every request
app.use(cors(corsOptions));

// Explicitly handle OPTIONS preflight for all routes.
// NOTE: Express 5 / path-to-regexp v8 does NOT allow bare "*" — use "/(.*)" instead.
app.options("/(.*)", cors(corsOptions));

// ─── Body Parsing ────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Static Files ─────────────────────────────────────────────────────────────
app.use("/uploads", express.static("uploads"));

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);
app.use("/api/company", companyRouter);
app.use("/api/job", jobRouter);
app.use("/api/interview", interviewRouter);
app.use("/api/ai-suggestion", aiSuggestionRouter);
app.use("/api/application", applicationRouter);
app.use("/api/saved", savedRouter);
app.use("/api/inquiry", inquiryRouter);

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get("/", (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "AI-JobPortal Backend API is running...",
    timestamp: new Date().toISOString(),
    allowedOrigins: ALLOWED_ORIGINS,
  });
});

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`[Server] Started on port ${PORT}`);
});