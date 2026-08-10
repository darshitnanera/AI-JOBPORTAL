import mongoose from "mongoose";

const inquirySchema = new mongoose.Schema(
    {
        fullName: {
            type: String,
            required: true,
        },
        email: {
            type: String,
            required: true,
        },
        phone: {
            type: String,
        },
        subject: {
            type: String,
            required: true,
        },
        message: {
            type: String,
            required: true,
        },
        status: {
            type: String,
            enum: ["pending", "contacted", "closed"],
            default: "pending",
        }
    },
    { timestamps: true }
);

export default mongoose.model("Inquiry", inquirySchema);
