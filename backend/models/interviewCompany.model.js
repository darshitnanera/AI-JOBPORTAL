import mongoose from "mongoose";

const interviewCompanySchema = new mongoose.Schema(
    {
        companyName: {
            type: String,
            required: true,
        },
        logo: {
            type: String, // URL from Cloudinary or similar
        },
        questionsCount: {
            type: String, // String to handle "10k+" format
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

export default mongoose.model("InterviewCompany", interviewCompanySchema);
