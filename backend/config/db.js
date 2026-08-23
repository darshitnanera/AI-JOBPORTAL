import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI;
    if (!uri) {
      console.warn("MONGO_URI not set. Skipping DB connection (use .env to configure a real DB).");
      console.warn("To setup MongoDB locally:");
      console.warn("  1. Docker: docker run -d --name mongodb -p 27017:27017 mongo:latest");
      console.warn("  2. Or install MongoDB: https://docs.mongodb.com/manual/installation/");
      return;
    }

    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });

    console.log("✅ DB CONNECTED to " + uri);
  } catch (error) {
    if (process.env.NODE_ENV === "production") {
      console.error("❌ MongoDB Connection Error:", error.message);
      process.exit(1);
    } else {
      console.error("⚠️  MongoDB Connection Error:", error.message);
      console.warn("Running in development mode without database. Some features will be limited.");
    }
  }
};