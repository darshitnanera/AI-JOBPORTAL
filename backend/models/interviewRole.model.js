import mongoose from "mongoose";

const interviewRoleSchema = new mongoose.Schema(
    {
        roleName: {
            type: String,
            required: true,
            unique: true,
        },
        image: {
            type: String, // Cloudinary URL
            required: true,
        },
        questionsCount: {
            type: String, // e.g. "10k+"
            required: true,
        },
        csvFileUrl: {
            type: String, // Cloudinary URL for the raw CSV file
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    { timestamps: true }
);

export default mongoose.model("InterviewRole", interviewRoleSchema);
