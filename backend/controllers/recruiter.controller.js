import Job from "../models/job.model.js";
import Application from "../models/application.model.js";
import User from "../models/user.model.js";
import { uploadToCloudinary } from "../utils/cloudinaryUpload.js";

// Create a new job posting (recruiter only)
export const createJobPosting = async (req, res) => {
    try {
        let {
            roleName,
            techStack,
            location,
            experience,
            salary,
            salaryType,
            jobType,
            overview,
            responsibilities,
            jobCriteria,
            education,
            openings,
            category,
        } = req.body;

        // Get recruiter's company info
        const recruiter = await User.findById(req.user.id);
        if (!recruiter || recruiter.role !== "recruiter") {
            return res.status(403).json({ success: false, message: "Only recruiters can post jobs" });
        }

        const companyName = recruiter.recruiterProfile?.companyName || "";
        const companyWebsite = recruiter.recruiterProfile?.companyWebsite || "";

        if (!companyName) {
            return res.status(400).json({
                success: false,
                message: "Please complete your recruiter profile with company information"
            });
        }

        // Handle arrays if sent as JSON strings
        if (typeof techStack === "string") techStack = JSON.parse(techStack);
        if (typeof responsibilities === "string") responsibilities = JSON.parse(responsibilities);
        if (typeof jobCriteria === "string") jobCriteria = JSON.parse(jobCriteria);
        if (typeof education === "string") education = JSON.parse(education);

        let companyLogo = "";
        if (req.file) {
            const uploadRes = await uploadToCloudinary(req.file.buffer, "jobportal/logos", "image", req.file.originalname);
            companyLogo = uploadRes.secure_url;
        }

        const postDate = new Date();
        const expiresAt = new Date(postDate.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days from now

        const job = new Job({
            companyLogo,
            roleName,
            companyName,
            techStack,
            location,
            experience,
            salary,
            salaryType: salaryType || "/month",
            jobType,
            postDate,
            category,
            openings: openings || 1,
            overview,
            responsibilities,
            jobCriteria,
            education,
            createdBy: req.user.id,
            postedBy: req.user.id,
            expiresAt,
            status: "active",
            applicationCount: 0,
        });

        await job.save();

        return res.status(201).json({
            success: true,
            message: "Job posted successfully",
            job,
        });
    } catch (error) {
        console.error("Error creating job:", error);
        return res.status(500).json({ success: false, message: error.message || "Server error" });
    }
};

// Get recruiter's jobs
export const getRecruiterJobs = async (req, res) => {
    try {
        const recruiterId = req.user.id;

        const jobs = await Job.find({ postedBy: recruiterId })
            .sort({ createdAt: -1 });

        // Get application counts for each job
        const applicationStats = await Application.aggregate([
            { $match: { job: { $in: jobs.map(j => j._id) } } },
            {
                $group: {
                    _id: "$job",
                    count: { $sum: 1 }
                }
            }
        ]);

        const countsMap = applicationStats.reduce((acc, curr) => {
            acc[curr._id.toString()] = curr.count;
            return acc;
        }, {});

        const jobsWithStats = jobs.map((job) => ({
            ...job._doc,
            applicantsCount: countsMap[job._id.toString()] || 0
        }));

        return res.status(200).json({
            success: true,
            jobs: jobsWithStats,
        });
    } catch (error) {
        console.error("Error fetching recruiter jobs:", error);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

// Update job status
export const updateJobStatus = async (req, res) => {
    try {
        const { jobId } = req.params;
        const { status } = req.body;

        const job = await Job.findOne({ _id: jobId, postedBy: req.user.id });
        if (!job) {
            return res.status(404).json({ success: false, message: "Job not found" });
        }

        if (!["active", "closed", "expired"].includes(status)) {
            return res.status(400).json({ success: false, message: "Invalid status" });
        }

        job.status = status;
        await job.save();

        return res.status(200).json({
            success: true,
            message: "Job status updated",
            job,
        });
    } catch (error) {
        console.error("Error updating job status:", error);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

// Delete job
export const deleteRecruiterJob = async (req, res) => {
    try {
        const { jobId } = req.params;

        const job = await Job.findOne({ _id: jobId, postedBy: req.user.id });
        if (!job) {
            return res.status(404).json({ success: false, message: "Job not found" });
        }

        // Delete associated applications
        await Application.deleteMany({ job: jobId });
        await job.deleteOne();

        return res.status(200).json({
            success: true,
            message: "Job deleted successfully",
        });
    } catch (error) {
        console.error("Error deleting job:", error);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

// Get recruiter's applications
export const getRecruiterApplications = async (req, res) => {
    try {
        const recruiterId = req.user.id;
        const { jobId, status } = req.query;

        // Get recruiter's jobs
        const recruiterJobs = await Job.find({ postedBy: recruiterId });
        const jobIds = recruiterJobs.map(j => j._id);

        // Build query
        let query = { job: { $in: jobIds } };
        if (jobId) query.job = jobId;
        if (status) query.status = status;

        const applications = await Application.find(query)
            .populate({
                path: "user",
                select: "name email phone resume"
            })
            .populate({
                path: "job",
                select: "roleName companyName"
            })
            .sort({ createdAt: -1 });

        const applicationsWithDetails = applications
            .filter(app => app.user && app.job)
            .map(app => ({
                applicationId: app._id,
                jobId: app.job._id,
                jobTitle: app.job.roleName,
                companyName: app.job.companyName,
                candidateName: app.user.name,
                candidateEmail: app.user.email,
                candidatePhone: app.user.phone,
                candidateResume: app.user.resume,
                status: app.status,
                appliedDate: app.createdAt,
            }));

        return res.status(200).json({
            success: true,
            applications: applicationsWithDetails,
        });
    } catch (error) {
        console.error("Error fetching recruiter applications:", error);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

// Update application status
export const updateApplicationStatus = async (req, res) => {
    try {
        const { applicationId } = req.params;
        const { status } = req.body;

        const application = await Application.findById(applicationId)
            .populate("job");

        if (!application) {
            return res.status(404).json({ success: false, message: "Application not found" });
        }

        // Verify recruiter owns this job
        if (application.job.postedBy.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: "Unauthorized" });
        }

        if (!["Applied", "Reviewing", "Shortlisted", "Rejected", "Accepted"].includes(status)) {
            return res.status(400).json({ success: false, message: "Invalid status" });
        }

        application.status = status;
        await application.save();

        return res.status(200).json({
            success: true,
            message: "Application status updated",
            application,
        });
    } catch (error) {
        console.error("Error updating application status:", error);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

// Bulk update application status
export const bulkUpdateApplicationStatus = async (req, res) => {
    try {
        const { applicationIds, status } = req.body;

        if (!Array.isArray(applicationIds) || applicationIds.length === 0) {
            return res.status(400).json({ success: false, message: "Invalid application IDs" });
        }

        if (!["Applied", "Reviewing", "Shortlisted", "Rejected", "Accepted"].includes(status)) {
            return res.status(400).json({ success: false, message: "Invalid status" });
        }

        // Get applications
        const applications = await Application.find({ _id: { $in: applicationIds } })
            .populate("job");

        // Verify recruiter owns all these jobs
        for (const app of applications) {
            if (app.job.postedBy.toString() !== req.user.id) {
                return res.status(403).json({ success: false, message: "Unauthorized" });
            }
        }

        // Update all
        await Application.updateMany(
            { _id: { $in: applicationIds } },
            { status }
        );

        return res.status(200).json({
            success: true,
            message: "Applications updated successfully",
        });
    } catch (error) {
        console.error("Error bulk updating applications:", error);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

// Get recruiter dashboard stats
export const getRecruiterDashboardStats = async (req, res) => {
    try {
        const recruiterId = req.user.id;

        // Get recruiter's jobs
        const recruiterJobs = await Job.find({ postedBy: recruiterId });
        const jobIds = recruiterJobs.map(j => j._id);

        const postedJobsCount = recruiterJobs.length;

        // Get applications for recruiter's jobs
        const recruiterApplications = await Application.find({ job: { $in: jobIds } });
        const activeApplicationsCount = recruiterApplications.filter(
            app => ["Applied", "Reviewing", "Shortlisted"].includes(app.status)
        ).length;

        // Get shortlisted count
        const shortlistedCount = recruiterApplications.filter(
            app => app.status === "Shortlisted"
        ).length;

        // Calculate conversion rate
        const totalApplications = recruiterApplications.length;
        const acceptedCount = recruiterApplications.filter(app => app.status === "Accepted").length;
        const conversionRate = totalApplications > 0
            ? ((acceptedCount / totalApplications) * 100).toFixed(2)
            : 0;

        // Get unique candidates viewed (distinct users who applied)
        const candidatesViewed = await Application.distinct("user", { job: { $in: jobIds } });

        return res.status(200).json({
            success: true,
            stats: {
                postedJobsCount,
                activeApplicationsCount,
                candidatesViewedCount: candidatesViewed.length,
                conversionRate: `${conversionRate}%`,
                shortlistedCount,
                totalApplications,
                acceptedCount,
            }
        });
    } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

// Get recent applications for dashboard
export const getRecentApplications = async (req, res) => {
    try {
        const recruiterId = req.user.id;
        const limit = req.query.limit || 5;

        const recruiterJobs = await Job.find({ postedBy: recruiterId });
        const jobIds = recruiterJobs.map(j => j._id);

        const applications = await Application.find({ job: { $in: jobIds } })
            .populate({
                path: "user",
                select: "name email"
            })
            .populate({
                path: "job",
                select: "roleName"
            })
            .sort({ createdAt: -1 })
            .limit(parseInt(limit));

        const recentApps = applications
            .filter(app => app.user && app.job)
            .map(app => ({
                applicationId: app._id,
                candidateName: app.user.name,
                jobTitle: app.job.roleName,
                status: app.status,
                appliedDate: app.createdAt,
            }));

        return res.status(200).json({
            success: true,
            applications: recentApps,
        });
    } catch (error) {
        console.error("Error fetching recent applications:", error);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};
