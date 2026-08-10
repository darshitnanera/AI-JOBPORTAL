import Job from "../models/job.model.js";
import Application from "../models/application.model.js";
import { uploadToCloudinary } from "../utils/cloudinaryUpload.js";

//create a new job(only admin)
export const createJob = async (req, res) => {
    try {
        let {
            roleName,
            companyName,
            techStack,
            location,
            experience,
            salary,
            salaryType,
            jobType,
            postDate,
            category,
            openings,
            overview,
            responsibilities,
            jobCriteria,
            education,
        } = req.body;

        // Handle arrays if sent as JSON strings from frontend FormData
        if (typeof techStack === "string") techStack = JSON.parse(techStack);
        if (typeof responsibilities === "string") responsibilities = JSON.parse(responsibilities);
        if (typeof jobCriteria === "string") jobCriteria = JSON.parse(jobCriteria);
        if (typeof education === "string") education = JSON.parse(education);

        let postDateValue;
        if (postDate) {
            if (typeof postDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(postDate)) {
                const [year, month, day] = postDate.split("-");
                // Use UTC to prevent timezone shifts across days
                postDateValue = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
            } else {
                postDateValue = new Date(postDate);
            }
            if (isNaN(postDateValue.getTime())) {
                postDateValue = new Date();
            }
        } else {
            postDateValue = new Date();
        }

        let companyLogo = "";
        if (req.file) {
            const uploadRes = await uploadToCloudinary(req.file.buffer, "jobportal/logos", "image", req.file.originalname);
            companyLogo = uploadRes.secure_url;
        }

        const job = new Job({
            companyLogo,
            roleName,
            companyName,
            techStack,
            location,
            experience,
            salary,
            salaryType,
            jobType,
            postDate,
            category,
            openings,
            overview,
            responsibilities,
            jobCriteria,
            education,
            postDate: postDateValue,
            createdBy: req.user.id,
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

//get all the job
export const getAllJobs = async (req, res) => {
    try {
        const { roleName, companyName, location, category, jobType, experience, minSalary, maxSalary, search } = req.query;
        const query = { status: "active" };

        //search by roleName, companyName, or techstack
        if (search) {
            query.$or = [
                { roleName: { $regex: search, $options: "i" } },
                { companyName: { $regex: search, $options: "i" } },
                { techStack: { $regex: search, $options: "i" } }
            ];
        }
        if (roleName) query.roleName = { $regex: roleName, $options: "i" };
        if (companyName) query.companyName = { $regex: companyName, $options: "i" };
        if (location) query.location = { $regex: location, $options: "i" };
        if (experience) query.experience = { $regex: experience, $options: "i" };

        if (category) {
            const categories = Array.isArray(category) ? category : category.split(",");
            query.category = { $in: categories.map(cat => new RegExp(cat, "i")) };
        }
        if (jobType) {
            const types = Array.isArray(jobType) ? jobType : jobType.split(",");
            const normalizeTypeToRegex = (type) => {
                const raw = String(type).trim();

                // Escape special characters
                const escaped = raw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

                // Normalize spaces, hyphens, underscores
                const normalized = escaped.replace(/[-_\s]+/g, "[-_\\s]*");

                return new RegExp(`^${normalized}$`, "i");
            };
            query.jobType = { $in: types.map(normalizeTypeToRegex) };
        }

        if (minSalary || maxSalary) {
            query.salary = {};
            if (minSalary) query.salary.$gte = Number(minSalary);
            if (maxSalary) query.salary.$lte = Number(maxSalary);
        }

        const jobs = await Job.find(query).sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: jobs.length,
            jobs,
        });
    } catch (error) {
        console.error("Error fetching jobs:", error);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

//get dashboard stats for admin
export const getDashboardStats = async (req, res) => {
    try {
        const adminId = req.user.id;
        const totalJobs = await Job.countDocuments();
        const closedJobs = await Job.countDocuments({ status: "closed" });
        const totalApplicationsResult = await Application.aggregate([
            {
                $lookup: {
                    from: "users",
                    localField: "user",
                    foreignField: "_id",
                    as: "userRecord"
                }
            },
            { $unwind: "$userRecord" },
            {
                $lookup: {
                    from: "jobs",
                    localField: "job",
                    foreignField: "_id",
                    as: "jobRecord"
                }
            },
            { $unwind: "$jobRecord" },
            { $count: "count" }
        ]);
        const totalApplications = totalApplicationsResult[0]?.count || 0;
        const companies = await Job.distinct("companyName", { status: "active" });
        const totalCompanies = companies.length;

        return res.status(200).json({
            success: true,
            stats: {
                totalJobs: totalJobs.toLocaleString(),
                closedJobs: closedJobs.toLocaleString(),
                totalApplicants: totalApplications.toLocaleString(),
                totalCompanies: totalCompanies.toLocaleString(),
            }
        });
    } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};
// Get all jobs posted by the admin

export const getJobsByAdmin = async (req, res) => {
    try {
        const jobs = await Job.find().sort({ createdAt: -1 });

        // Get counts for all jobs in one go using aggregation for better performance
        const applicationStats = await Application.aggregate([
            {
                $lookup: {
                    from: "users",
                    localField: "user",
                    foreignField: "_id",
                    as: "userRecord"
                }
            },
            { $unwind: "$userRecord" },
            {
                $group: {
                    _id: "$job",
                    count: { $sum: 1 }
                }
            }
        ]);

        // Map counts for easy lookup
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
        console.error("Error fetching admin jobs:", error);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

//Get job by ID

export const getJobById = async (req, res) => {
    try {
        const job = await Job.findById(req.params.id);
        if (!job) {
            return res.status(404).json({ success: false, message: "Job not found" });
        }
        return res.status(200).json({
            success: true,
            job,
        });
    } catch (error) {
        console.error("Error fetching job:", error);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

// Update a job

export const updateJob = async (req, res) => {
    try {
        let {
            roleName,
            companyName,
            techStack,
            location,
            experience,
            salary,
            salaryType,
            jobType,
            postDate,
            category,
            openings,
            overview,
            responsibilities,
            jobCriteria,
            education,
        } = req.body;

        // Handle arrays if sent as JSON strings from frontend FormData
        if (typeof techStack === "string") techStack = JSON.parse(techStack);
        if (typeof responsibilities === "string") responsibilities = JSON.parse(responsibilities);
        if (typeof jobCriteria === "string") jobCriteria = JSON.parse(jobCriteria);
        if (typeof education === "string") education = JSON.parse(education);

        let postDateValue;
        if (postDate) {
            if (typeof postDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(postDate)) {
                const [year, month, day] = postDate.split("-");
                // Use UTC to prevent timezone shifts across days
                postDateValue = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
            } else {
                postDateValue = new Date(postDate);
            }
            if (isNaN(postDateValue.getTime())) {
                postDateValue = new Date();
            }
        } else {
            postDateValue = new Date();
        }

        let job = await Job.findById(req.params.id);

        if (!job) {
            return res.status(404).json({ success: false, message: "Job not found" });
        }

        // Admins can update any job

        let companyLogo = job.companyLogo;
        if (req.file) {
            const uploadRes = await uploadToCloudinary(req.file.buffer, "jobportal/logos", "image", req.file.originalname);
            companyLogo = uploadRes.secure_url;
        }

        job = await Job.findByIdAndUpdate(
            req.params.id,
            {
                companyLogo,
                roleName,
                companyName,
                techStack,
                location,
                experience,
                salary,
                salaryType,
                jobType,
                postDate: postDateValue,
                category,
                openings,
                overview,
                responsibilities,
                jobCriteria,
                education,
            },
            { returnDocument: 'after', runValidators: true }
        );

        return res.status(200).json({
            success: true,
            message: "Job updated successfully",
            job,
        });
    } catch (error) {
        console.error("Error updating job:", error);
        return res.status(500).json({ success: false, message: error.message || "Server error" });
    }
};

//Delete a job

export const deleteJob = async (req, res) => {
    try {
        const job = await Job.findById(req.params.id);

        if (!job) {
            return res.status(404).json({ success: false, message: "Job not found" });
        }

        // Admins can delete any job

        // Delete associated applications first to keep counts accurate
        await Application.deleteMany({ job: req.params.id });
        await job.deleteOne();

        return res.status(200).json({
            success: true,
            message: "Job deleted successfully and associated applications removed",
        });
    } catch (error) {
        console.error("Error deleting job:", error);
        return res.status(500).json({ success: false, message: error.message || "Server error" });
    }
};
export const closeJob = async (req, res) => {
    try {
        const job = await Job.findById(req.params.id);

        if (!job) {
            return res.status(404).json({ success: false, message: "Job not found" });
        }

        job.status = "closed";
        await job.save();

        return res.status(200).json({
            success: true,
            message: "Job closed successfully",
            job,
        });
    } catch (error) {
        console.error("Error closing job:", error);
        return res.status(500).json({ success: false, message: error.message || "Server error" });
    }
};
