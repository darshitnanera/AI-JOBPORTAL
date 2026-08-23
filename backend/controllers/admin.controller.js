import User from "../models/user.model.js";
import Job from "../models/job.model.js";
import Application from "../models/application.model.js";

// Get platform statistics
export const getPlatformStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalCandidates = await User.countDocuments({ userType: "candidate" });
    const totalRecruiters = await User.countDocuments({ userType: "recruiter" });
    const activeUsers = await User.countDocuments({ isVerified: true });

    const totalJobs = await Job.countDocuments();
    const activeJobs = await Job.countDocuments({ status: "active" });
    const closedJobs = await Job.countDocuments({ status: "closed" });

    const totalApplications = await Application.countDocuments();
    const appliedApplications = await Application.countDocuments({ status: "Applied" });
    const shortlistedApplications = await Application.countDocuments({ status: "Shortlisted" });
    const rejectedApplications = await Application.countDocuments({ status: "Rejected" });

    const stats = {
      users: {
        total: totalUsers,
        candidates: totalCandidates,
        recruiters: totalRecruiters,
        active: activeUsers,
        inactive: totalUsers - activeUsers
      },
      jobs: {
        total: totalJobs,
        active: activeJobs,
        closed: closedJobs,
        expired: await Job.countDocuments({ status: "expired" })
      },
      applications: {
        total: totalApplications,
        applied: appliedApplications,
        shortlisted: shortlistedApplications,
        rejected: rejectedApplications,
        accepted: await Application.countDocuments({ status: "Accepted" })
      }
    };

    res.status(200).json({ success: true, stats });
  } catch (error) {
    console.error("Error fetching platform stats:", error);
    res.status(500).json({ success: false, message: "Error fetching statistics" });
  }
};

// Get all users with pagination
export const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, type = "", status = "" } = req.query;
    const skip = (page - 1) * limit;

    let filter = {};
    if (type && ["candidate", "recruiter", "admin"].includes(type)) {
      filter.userType = type;
    }
    if (status === "active") {
      filter.isVerified = true;
    } else if (status === "inactive") {
      filter.isVerified = false;
    }

    const users = await User.find(filter)
      .select("-password")
      .limit(limit)
      .skip(skip)
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(filter);

    res.status(200).json({
      success: true,
      users,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: page
      }
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ success: false, message: "Error fetching users" });
  }
};

// Deactivate/Activate user
export const toggleUserStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { isVerified } = req.body;

    const user = await User.findByIdAndUpdate(
      userId,
      { isVerified },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.status(200).json({
      success: true,
      message: `User ${isVerified ? "activated" : "deactivated"}`,
      user
    });
  } catch (error) {
    console.error("Error updating user status:", error);
    res.status(500).json({ success: false, message: "Error updating user status" });
  }
};

// Verify recruiter
export const verifyRecruiter = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findByIdAndUpdate(
      userId,
      { "recruiterProfile.isVerified": true },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.status(200).json({
      success: true,
      message: "Recruiter verified successfully",
      user
    });
  } catch (error) {
    console.error("Error verifying recruiter:", error);
    res.status(500).json({ success: false, message: "Error verifying recruiter" });
  }
};

// Delete user
export const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findByIdAndDelete(userId);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.status(200).json({
      success: true,
      message: "User deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ success: false, message: "Error deleting user" });
  }
};

// Get all jobs with pagination
export const getAllJobs = async (req, res) => {
  try {
    const { page = 1, limit = 10, status = "", recruiter = "" } = req.query;
    const skip = (page - 1) * limit;

    let filter = {};
    if (status && ["active", "closed", "expired"].includes(status)) {
      filter.status = status;
    }
    if (recruiter) {
      filter.createdBy = recruiter;
    }

    const jobs = await Job.find(filter)
      .populate("createdBy", "name email recruiterProfile")
      .limit(limit)
      .skip(skip)
      .sort({ createdAt: -1 });

    const total = await Job.countDocuments(filter);

    res.status(200).json({
      success: true,
      jobs,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: page
      }
    });
  } catch (error) {
    console.error("Error fetching jobs:", error);
    res.status(500).json({ success: false, message: "Error fetching jobs" });
  }
};

// Update job status
export const updateJobStatus = async (req, res) => {
  try {
    const { jobId } = req.params;
    const { status } = req.body;

    if (!["active", "closed", "expired"].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status" });
    }

    const job = await Job.findByIdAndUpdate(
      jobId,
      { status },
      { new: true }
    ).populate("createdBy", "name email");

    if (!job) {
      return res.status(404).json({ success: false, message: "Job not found" });
    }

    res.status(200).json({
      success: true,
      message: `Job status updated to ${status}`,
      job
    });
  } catch (error) {
    console.error("Error updating job status:", error);
    res.status(500).json({ success: false, message: "Error updating job status" });
  }
};

// Delete job
export const deleteJob = async (req, res) => {
  try {
    const { jobId } = req.params;

    const job = await Job.findByIdAndDelete(jobId);

    if (!job) {
      return res.status(404).json({ success: false, message: "Job not found" });
    }

    res.status(200).json({
      success: true,
      message: "Job deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting job:", error);
    res.status(500).json({ success: false, message: "Error deleting job" });
  }
};

// Get all applications
export const getAllApplications = async (req, res) => {
  try {
    const { page = 1, limit = 10, job = "", status = "" } = req.query;
    const skip = (page - 1) * limit;

    let filter = {};
    if (job) {
      filter.job = job;
    }
    if (status && ["Applied", "Reviewing", "Shortlisted", "Rejected", "Accepted"].includes(status)) {
      filter.status = status;
    }

    const applications = await Application.find(filter)
      .populate("job", "roleName companyName")
      .populate("user", "name email parsedResume")
      .limit(limit)
      .skip(skip)
      .sort({ createdAt: -1 });

    const total = await Application.countDocuments(filter);

    res.status(200).json({
      success: true,
      applications,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: page
      }
    });
  } catch (error) {
    console.error("Error fetching applications:", error);
    res.status(500).json({ success: false, message: "Error fetching applications" });
  }
};

// Update application status
export const updateApplicationStatus = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { status } = req.body;

    if (!["Applied", "Reviewing", "Shortlisted", "Rejected", "Accepted"].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status" });
    }

    const application = await Application.findByIdAndUpdate(
      applicationId,
      { status },
      { new: true }
    )
      .populate("job", "roleName companyName")
      .populate("user", "name email");

    if (!application) {
      return res.status(404).json({ success: false, message: "Application not found" });
    }

    res.status(200).json({
      success: true,
      message: `Application status updated to ${status}`,
      application
    });
  } catch (error) {
    console.error("Error updating application status:", error);
    res.status(500).json({ success: false, message: "Error updating application status" });
  }
};

// Get analytics data
export const getAnalytics = async (req, res) => {
  try {
    // Job posting trends (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const jobTrends = await Job.aggregate([
      {
        $match: {
          createdAt: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Application trends (last 30 days)
    const applicationTrends = await Application.aggregate([
      {
        $match: {
          createdAt: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // User growth (last 30 days)
    const userGrowth = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.status(200).json({
      success: true,
      analytics: {
        jobTrends,
        applicationTrends,
        userGrowth
      }
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    res.status(500).json({ success: false, message: "Error fetching analytics" });
  }
};
