import mongoose from "mongoose";

const roleQuestionSchema = new mongoose.Schema(
    {
        roleId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "InterviewRole",
            required: true,
        },
        question: {
            type: String,
            required: true,
        },
        answer: {
            type: String,
            required: true,
        },
        keyPoints: [
            {
                type: String,
            },
        ],
        askedBy: [
            {
                companyName: String,
                dateAsked: String,
            },
        ],
    },
    { timestamps: true }
);

export default mongoose.model("RoleQuestion", roleQuestionSchema);
