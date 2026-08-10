import Inquiry from "../models/inquiry.model.js";
import { sendAdminInquiryEmail } from "../utils/emailService.js";

//   Submit new inquiry
export const submitInquiry = async (req, res) => {
    try {
        const { fullName, email, phone, subject, message } = req.body;

        if (!fullName || !email || !subject || !message) {
            return res.status(400).json({
                success: false,
                message: "Please provide all required fields (Full Name, Email, Subject, Message)",
            });
        }

        const inquiry = await Inquiry.create({
            fullName,
            email,
            phone,
            subject,
            message,
        });

        // Notify Admin via Email
        try {
            await sendAdminInquiryEmail({ fullName, email, phone, subject, message });
        } catch (emailError) {
            console.error("Failed to notify admin via email:", emailError);
        }

        res.status(201).json({
            success: true,
            inquiry,
            message: "Inquiry submitted successfully",
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};


