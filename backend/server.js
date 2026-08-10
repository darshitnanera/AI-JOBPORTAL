import express from "express";
import 'dotenv/config'
import { connectDB } from "./config/db.js";

import cors from "cors";
import authRouter from "./routes/auth.routes.js";
import userRouter from "./routes/user.routes.js";
import companyRouter from "./routes/company.routes.js";
import jobRouter from "./routes/job.routes.js";
import interviewRouter from "./routes/interview.routes.js";
import applicationRouter from "./routes/application.routes.js";
import savedRouter from "./routes/saved.routes.js";
import inquiryRouter from "./routes/inquiry.routes.js";

const PORT = 5000;
const app = express();

connectDB();
//middleware
app.use(express.json());

app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:5174", "https://jobportal-two-lemon.vercel.app/"],
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
app.use("/api/application", applicationRouter);
app.use("/api/saved", savedRouter);
app.use("/api/inquiry", inquiryRouter);

//test route
app.get("/", (req, res) => {
  res.send("API is running...");
});

app.listen(PORT, () => {
  console.log(`Server Started on http://localhost:${PORT}`);
});