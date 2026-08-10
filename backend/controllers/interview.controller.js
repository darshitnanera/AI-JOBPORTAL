import InterviewCompany from "../models/interviewCompany.model.js";
import InterviewQuestion from "../models/InterviewQuestion.model.js";
import InterviewRole from "../models/interviewRole.model.js";
import RoleQuestion from "../models/roleQuestion.model.js";

import {
    uploadFiles,
    parseQuestions,
    replaceQuestions,
    handleError
} from "../utils/helpers.js";
// ================= COMPANY =================
// Add Company
export const addInterviewCompany = async (req, res) => {
    try {
        const { companyName, questionsCount, questionsData } = req.body;

        if (!companyName || !questionsCount) {
            return res.status(400).json({ message: "Required fields missing" });
        }
        const exists = await InterviewCompany.findOne({ companyName });
        if (exists) {
            return res.status(400).json({ message: "Company already exists" });
        }
        const uploads = await uploadFiles(req.files, {
            logoFile: { folder: "jobportal/logos", type: "image" },
            csvFile: { folder: "jobportal/csv", type: "raw" }
        });
        const company = await InterviewCompany.create({
            companyName,
            logo: uploads.logoFile || "",
            questionsCount,
            csvFileUrl: uploads.csvFile || "",
            createdBy: req.user.id,
        });
        if (questionsData) {
            const formatted = parseQuestions(
                questionsData,
                "company",
                company._id,
                req.user.id
            );
            await InterviewQuestion.insertMany(formatted);
        }
        res.status(201).json({ success: true, company });
    } catch (err) {
        handleError(res, err);
    }
};

// Get Companies
export const getInterviewCompanies = async (req, res) => {
    try {
        const companies = await InterviewCompany.find().sort({ createdAt: -1 });
        res.status(200).json({ success: true, companies });
    } catch (err) {
        handleError(res, err);
    }
};
// Get Questions by Company
export const getInterviewQuestionsByCompany = async (req, res) => {
    try {
        const { companyId } = req.params;

        const [company, questions] = await Promise.all([
            InterviewCompany.findById(companyId),
            InterviewQuestion.find({ company: companyId }).sort({ createdAt: 1 })
        ]);

        res.status(200).json({ success: true, company, questions });

    } catch (err) {
        handleError(res, err);
    }
};
// Update Company
export const updateInterviewCompany = async (req, res) => {
    try {
        const { companyId } = req.params;
        const { companyName, questionsCount, questionsData } = req.body;

        const company = await InterviewCompany.findById(companyId);
        if (!company) {
            return res.status(404).json({ message: "Company not found" });
        }

        if (companyName) company.companyName = companyName;
        if (questionsCount) company.questionsCount = questionsCount;

        const uploads = await uploadFiles(req.files, {
            logoFile: { folder: "jobportal/logos", type: "image" },
            csvFile: { folder: "jobportal/csv", type: "raw" }
        });

        if (uploads.logoFile) company.logo = uploads.logoFile;
        if (uploads.csvFile) company.csvFileUrl = uploads.csvFile;

        await company.save();

        if (questionsData) {
            const formatted = parseQuestions(
                questionsData,
                "company",
                company._id,
                req.user.id
            );

            await replaceQuestions(
                InterviewQuestion,
                { company: companyId },
                formatted
            );
        }

        res.status(200).json({ success: true, company });

    } catch (err) {
        handleError(res, err);
    }
};


// Delete Company
export const deleteInterviewCompany = async (req, res) => {
    try {
        const { companyId } = req.params;

        await InterviewCompany.findByIdAndDelete(companyId);
        await InterviewQuestion.deleteMany({ company: companyId });

        res.status(200).json({
            success: true,
            message: "Company deleted"
        });

    } catch (err) {
        handleError(res, err);
    }
};



// ================= ROLE =================

// Add Role
export const addInterviewRole = async (req, res) => {
    try {
        const { roleName, questionsCount, questionsData } = req.body;
        if (!roleName || !questionsCount) {
            return res.status(400).json({ message: "Required fields missing" });
        }
        const exists = await InterviewRole.findOne({ roleName });
        if (exists) {
            return res.status(400).json({ message: "Role already exists" });
        }
        const uploads = await uploadFiles(req.files, {
            imageFile: { folder: "jobportal/roles", type: "image" },
            csvFile: { folder: "jobportal/csv", type: "raw" }
        });
        const role = await InterviewRole.create({
            roleName,
            image: uploads.imageFile || "",
            questionsCount,
            csvFileUrl: uploads.csvFile || "",
            createdBy: req.user.id,
        });
        if (questionsData) {
            const formatted = parseQuestions(
                questionsData,
                "role",
                role._id,
                req.user.id
            );
            await RoleQuestion.insertMany(formatted);
        }
        res.status(201).json({ success: true, role });
    } catch (err) {
        handleError(res, err);
    }
};
// Get Roles
export const getInterviewRoles = async (req, res) => {
    try {
        const roles = await InterviewRole.find().sort({ createdAt: -1 });
        res.status(200).json({ success: true, roles });
    } catch (err) {
        handleError(res, err);
    }
};

// Get Questions by Role
export const getQuestionsByRole = async (req, res) => {
    try {
        const { roleId } = req.params;

        const [role, questions] = await Promise.all([
            InterviewRole.findById(roleId),
            RoleQuestion.find({ roleId }).sort({ createdAt: 1 })
        ]);

        res.status(200).json({ success: true, role, questions });

    } catch (err) {
        handleError(res, err);
    }
};


// Update Role
export const updateInterviewRole = async (req, res) => {
    try {
        const { roleId } = req.params;
        const { roleName, questionsCount, questionsData } = req.body;

        const role = await InterviewRole.findById(roleId);
        if (!role) {
            return res.status(404).json({ message: "Role not found" });
        }

        if (roleName) role.roleName = roleName;
        if (questionsCount) role.questionsCount = questionsCount;

        const uploads = await uploadFiles(req.files, {
            imageFile: { folder: "jobportal/roles", type: "image" },
            csvFile: { folder: "jobportal/csv", type: "raw" }
        });

        if (uploads.imageFile) role.image = uploads.imageFile;
        if (uploads.csvFile) role.csvFileUrl = uploads.csvFile;

        await role.save();

        if (questionsData) {
            const formatted = parseQuestions(
                questionsData,
                "role",
                role._id,
                req.user.id
            );

            await replaceQuestions(
                RoleQuestion,
                { roleId },
                formatted
            );
        }

        res.status(200).json({ success: true, role });

    } catch (err) {
        handleError(res, err);
    }
};


// Delete Role
export const deleteInterviewRole = async (req, res) => {
    try {
        const { roleId } = req.params;

        await InterviewRole.findByIdAndDelete(roleId);
        await RoleQuestion.deleteMany({ roleId });

        res.status(200).json({
            success: true,
            message: "Role deleted"
        });

    } catch (err) {
        handleError(res, err);
    }
};