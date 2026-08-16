import express from "express";
import 'dotenv/config'
import { connectDB } from "./config/db.js";

import cors from "cors";
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
//middleware
app.use(express.json());

// Configure CORS using an environment-driven allowlist. Set CORS_ORIGINS as a comma-separated list in production (e.g. in Render/Railway).
const defaultOrigins = "http://localhost:5173,http://localhost:5174,https://jobportal-issmtuopx-darshitnanera544-4827s-projects.vercel.app,https://ai-jobportal-71nn.vercel.app,https://ai-jobportal-six.vercel.app";
const allowedOrigins = (process.env.CORS_ORIGINS || defaultOrigins).split(",").map((s) => s.trim()).filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow non-browser requests like curl/postman when origin is undefined
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error(`CORS policy: origin ${origin} not allowed`), false);
    },
    credentials: true,
  })
);

app.use("/uploads", express.static("uploads"));

//routes
app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);
app.use("/api/company", companyRouter);
app.use("/api/job", jobRouter);
app.use("/api/interview", interviewRouter);
app.use("/api/ai-suggestion", aiSuggestionRouter);
app.use("/api/application", applicationRouter);
app.use("/api/saved", savedRouter);
app.use("/api/inquiry", inquiryRouter);

//test route
app.get("/", (req, res) => {
  res.send("API is running...");
});

app.listen(PORT, () => {
  console.log(`Server Started on port ${PORT}`);
});