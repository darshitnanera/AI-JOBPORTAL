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
    console.warn("Warning - missing environment variables:", missingEnv.join(", ")); // warn in development
  }
}

// Global middlewares
app.use(express.json());

// --- Robust CORS Configuration ---
const defaultOrigins = [
  "https://jobportal-app-three.vercel.app",
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:3000",
  "http://localhost:5000",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
];

// Helper to normalize origins (strip trailing slashes)
const normalizeOrigin = (url) => (url ? url.trim().replace(/\/+$/, "") : "");

// Collect configured origins from CLIENT_URL and CORS_ORIGINS
const envClientOrigins = [
  ...(process.env.CLIENT_URL ? process.env.CLIENT_URL.split(",") : []),
  ...(process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(",") : []),
  ...defaultOrigins,
]
  .map(normalizeOrigin)
  .filter(Boolean);

const allowedOriginsSet = new Set(envClientOrigins);

const corsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser requests (e.g. server-to-server, curl, Postman, health checks)
    if (!origin) return callback(null, true);

    const normalized = normalizeOrigin(origin);

    // Check allowlist
    if (allowedOriginsSet.has(normalized)) {
      return callback(null, true);
    }

    // Allow Vercel preview/branch deployments matching jobportal domain pattern
    if (/^https:\/\/[a-z0-9-]+-.*\.vercel\.app$/i.test(normalized) || normalized.endsWith(".vercel.app")) {
      return callback(null, true);
    }

    console.warn(`[CORS Blocked] Origin not allowed: ${origin}`);
    return callback(new Error(`CORS policy: origin ${origin} not allowed`), false);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
    "Origin",
  ],
  exposedHeaders: ["Content-Disposition", "Content-Length"],
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

app.use("/uploads", express.static("uploads"));

// Routes
app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);
app.use("/api/company", companyRouter);
app.use("/api/job", jobRouter);
app.use("/api/interview", interviewRouter);
app.use("/api/ai-suggestion", aiSuggestionRouter);
app.use("/api/application", applicationRouter);
app.use("/api/saved", savedRouter);
app.use("/api/inquiry", inquiryRouter);

// Health check / test
app.get("/", (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "AI-JobPortal Backend API is running...",
    timestamp: new Date().toISOString(),
  });
});

app.listen(PORT, () => {
  console.log(`Server Started on port ${PORT}`);
});