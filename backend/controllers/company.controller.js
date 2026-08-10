import Company from "../models/company.model.js";
import { uploadToCloudinary } from "../utils/cloudinaryUpload.js";

//  Get all companies (user)
export const getCompanies = async (req, res) => {
  try {
    const companies = await Company.find();
    res.status(200).json({
      success: true,
      companies,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

//  Add company (ONLY admin)
export const addCompany = async (req, res) => {
  try {
    const { website } = req.body;

    if (!website) {
      return res.status(400).json({
        success: false,
        message: "Website is required",
      });
    }
    let logoUrl = "";
    if (req.file) {
      const uploadResult = await uploadToCloudinary(
        req.file.buffer,
        "jobportal/logos",
        "image",
        req.file.originalname
      );
      logoUrl = uploadResult.secure_url;
    }
    const company = await Company.create({
      logo: logoUrl,
      website,
      createdBy: req.user.id,
    });

    res.status(201).json({
      success: true,
      message: "Company added successfully",
      company,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
//delete the company(for admin)
export const deleteCompany = async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Company not found",
      });
    }
    await company.deleteOne();

    res.status(200).json({
      success: true,
      message: "Company deleted successfully",
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};