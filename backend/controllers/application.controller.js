import Application from "../models/application.model.js";
import Job from "../models/job.model.js";
import User from "../models/user.model.js";

//apply for a job
export const applyJob = async (req, res) => {
    try {
        const jobId = req.params.id;
        const userId = req.user.id;

        if (!jobId) {
            return res.status(400).json({ success: false, message: "Job ID is required" });
        }
        //check job exists
        const job = await Job.findById(jobId);
        if (!job) {
            return res.status(404).json({ success: false, message: "Job not found" });
        }

        // Check if user's profile is complete
        const user = await User.findById(userId);
        if (!user || !user.phone || !user.resume) {
            return res.status(400).json({
                success: false,
                message: "Please complete your profile (add phone number and resume) in your profile page before applying."
            });
        }
        //check if user already applied
        const existingApplication = await Application.findOne({ job: jobId, user: userId });
        if (existingApplication) {
            return res.status(400).json({ success: false, message: "You have already applied for this job" });
        }
        const newapplication = new Application({
            job: jobId,
            user: userId,
        });
        await newapplication.save();
        return res.status(201).json({ success: true, message: "Application submitted successfully" });

    } catch (error) {
        console.error("Error applying for job:", error);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

//get all applicants for a job (only for admin)
export const getApplicants = async (req, res) => {
    try {
        const jobId = req.params.id;
        const job = await Job.findById(jobId);
        if (!job) {
            return res.status(404).json({ success: false, message: "Job not found" });
        }
        const applications = await Application.find({ job: jobId }).populate({
            path: "user",
            select: "name email phone role resume"
        }).sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            jobName: job.roleName,
            applicants: applications
                .filter(app => app.user) // filter out deleted users
                .map(app => ({
                    applicationId: app._id,
                    ...app.user._doc,
                    appliedDate: app.createdAt,
                    resume: app.user.resume || ""
                })),
        });
    } catch (error) {
        console.error("Error fetching applicants:", error);
        return res.status(500).json({ success: false, message: "Server error" });
    }
}

//get all jobs applied by a user
export const getUserApplications = async (req, res) => {
    try {
        const userId = req.user.id;
        const applications = await Application.find({ user: userId }).populate("job").sort({ createdAt: -1 });

        // Filter out applications where the job has been deleted
        const validApplications = applications.filter(app => app.job !== null);

        return res.status(200).json({ success: true, applications: validApplications });
    } catch (error) {
        console.error("Error fetching user applications:", error);
        return res.status(500).json({ success: false, message: "Server error" });
    }
}
