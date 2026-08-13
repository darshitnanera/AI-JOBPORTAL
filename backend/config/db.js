import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI;
    if (!uri) {
      console.warn("MONGO_URI not set. Skipping DB connection (use .env to configure a real DB).");
      return;
    }

    await mongoose.connect(uri);

    console.log("✅ DB CONNECTED");
  } catch (error) {
    console.error("❌ MongoDB Connection Error:", error.message);
    process.exit(1);
  }
};