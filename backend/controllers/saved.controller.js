import User from "../models/user.model.js";


//Toggle save job
export const toggleSaveJob = async (req, res) => {
    try {
        const { jobId } = req.params;
        const userId = req.user.id;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const isSaved = user.savedJobs.includes(jobId);

        if (isSaved) {
            // Unsave
            user.savedJobs = user.savedJobs.filter(id => id.toString() !== jobId);
        } else {
            // Save
            user.savedJobs.push(jobId);
        }

        await user.save();

        res.status(200).json({
            success: true,
            message: isSaved ? "Job unsaved" : "Job saved",
            savedJobs: user.savedJobs
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

//Toggle save question
export const toggleSaveQuestion = async (req, res) => {
    try {
        const { questionId } = req.params;
        const { type } = req.query; // 'interview' or 'role'
        const userId = req.user.id;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        let isSaved;
        let message;

        if (type === 'role') {
            isSaved = user.savedRoleQuestions.includes(questionId);
            if (isSaved) {
                user.savedRoleQuestions = user.savedRoleQuestions.filter(id => id.toString() !== questionId);
                message = "Question unsaved";
            } else {
                user.savedRoleQuestions.push(questionId);
                message = "Question saved";
            }
        } else {
            // default to interview question
            isSaved = user.savedInterviewQuestions.includes(questionId);
            if (isSaved) {
                user.savedInterviewQuestions = user.savedInterviewQuestions.filter(id => id.toString() !== questionId);
                message = "Question unsaved";
            } else {
                user.savedInterviewQuestions.push(questionId);
                message = "Question saved";
            }
        }

        await user.save();

        res.status(200).json({
            success: true,
            message,
            savedInterviewQuestions: user.savedInterviewQuestions,
            savedRoleQuestions: user.savedRoleQuestions
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get all saved items
export const getSavedItems = async (req, res) => {
    try {
        const userId = req.user.id;

        const user = await User.findById(userId)
            .populate("savedJobs")
            .populate({
                path: "savedInterviewQuestions",
                populate: { path: "company" }
            })
            .populate({
                path: "savedRoleQuestions",
                populate: { path: "roleId" }
            });

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        res.status(200).json({
            success: true,
            savedJobs: user.savedJobs,
            savedInterviewQuestions: user.savedInterviewQuestions,
            savedRoleQuestions: user.savedRoleQuestions
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
