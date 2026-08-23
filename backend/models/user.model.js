import mongoose from "mongoose";

const recruiterProfileSchema = new mongoose.Schema({
  companyName: {
    type: String,
    default: ""
  },
  companyWebsite: {
    type: String,
    default: ""
  },
  industryType: {
    type: String,
    default: ""
  },
  companySize: {
    type: String,
    enum: ["1-10", "11-50", "51-200", "201-500", "501-1000", "1000+"],
    default: ""
  },
  isVerified: {
    type: Boolean,
    default: false
  }
});

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    unique: true,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  phone: {
    type: String,

    default: ""
  },
  role: {
    type: String,
    enum: ["user", "candidate", "recruiter", "admin"],
    default: "user"
  },
  userType: {
    type: String,
    enum: ["candidate", "recruiter", "admin"],
    default: "candidate"
  },
  recruiterProfile: recruiterProfileSchema,
  profileCompleted: {
    type: Boolean,
    default: false
  },

  resume: {
    type: String,
    default: ""
  },
  resumePublicId: {
    type: String,
    default: ""
  },
  parsedResume: {
    skills: [String],
    experience: [{
      company: String,
      role: String,
      duration: String,
      description: String,
    }],
    education: [{
      school: String,
      degree: String,
      field: String,
      year: String,
    }],
    projects: [{
      name: String,
      description: String,
      tech: [String],
    }],
    certifications: [{
      name: String,
      issuer: String,
      date: String,
    }],
    contact: {
      email: String,
      phone: String,
      location: String,
      linkedin: String,
    },
    summary: String,
    rawText: String,
  },
  resumeVersions: [{
    version: {
      type: Number,
      default: 1
    },
    parsedData: mongoose.Schema.Types.Mixed,
    createdAt: {
      type: Date,
      default: Date.now
    },
    notes: String
  }],
  savedJobs: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Job"
  }],
  savedInterviewQuestions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "InterviewQuestion"
  }],
  savedRoleQuestions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "RoleQuestion"
  }],
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationOTP: String,
  verificationOTPExpires: Date,
  resetPasswordOTP: String,
  resetPasswordOTPExpires: Date,
}, { timestamps: true });

export default mongoose.model("User", userSchema);
