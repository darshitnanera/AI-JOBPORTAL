import React, { useState, useEffect } from "react";
import {
  User,
  Mail,
  Phone,
  Upload,
  Trash2,
  Save,
  X,
  Edit3,
  FileText,
  Loader2,
} from "lucide-react";
import { viewProfilePageStyles as s } from "../../assets/dummyStyles";

// Simple toast component
const Toast = ({ message, type = "success", onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={s.toast.container}>
      <div
        className={`${s.toast.card} ${type === "success" ? s.toast.cardSuccess : s.toast.cardError}`}
      >
        <div
          className={`${s.toast.indicator} ${type === "success" ? s.toast.indicatorSuccess : s.toast.indicatorError}`}
        />
        <span className={s.toast.message}>{message}</span>
        <button onClick={onClose} className={s.toast.closeButton}>
          <X className={s.toast.closeIcon} />
        </button>
      </div>
    </div>
  );
};

const ViewProfilePage = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
    resume: null,
  });
  const [originalProfile, setOriginalProfile] = useState(null);
  const [toast, setToast] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const user = JSON.parse(localStorage.getItem("jobportal_user"));

        const res = await fetch("http://localhost:5000/api/user/profile", {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        });

        const data = await res.json();
        setProfile({
          name: data.user.name || "",
          email: data.user.email || "",
          phone: data.user.phone || "",
          resume: data.user.resume || null,
        });

        setOriginalProfile(data.user);
      } catch (err) {
        console.error(err);
      }
    };
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handlePhoneChange = (e) => {
    const raw = e.target.value;
    const digits = raw.replace(/\D/g, "").slice(0, 10);
    setProfile((prev) => ({ ...prev, phone: digits }));
  };

  const handleResumeUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setProfile((prev) => ({
      ...prev,
      resume: file,
    }));
  };

  const handleDeleteResume = () => {
    setProfile((prev) => ({ ...prev, resume: null }));
  };

  const validate = () => {
    if (!profile.name.trim()) return "Name is required";
    if (!profile.email.trim()) return "Email is required";
    if (!/\S+@\S+\.\S+/.test(profile.email)) return "Email is invalid";
    if (!profile.phone) return "Phone is required";
    if (!/^\d{10}$/.test(profile.phone))
      return "Phone must be exactly 10 digits";

    return null;
  };

  const handleSave = async () => {
    const error = validate();
    if (error) {
      setToast({ message: error, type: "error" });
      return;
    }

    try {
      setIsSaving(true);
      const user = JSON.parse(localStorage.getItem("jobportal_user"));
      const formData = new FormData();
      formData.append("name", profile.name);
      formData.append("email", profile.email);
      formData.append("phone", profile.phone);

      if (profile.resume instanceof File) {
        formData.append("resume", profile.resume);
      }
      const res = await fetch("http://localhost:5000/api/user/profile", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
        body: formData,
      });
      const data = await res.json();
      setProfile({
        name: data.user.name,
        email: data.user.email,
        phone: data.user.phone,
        resume: data.user.resume,
      });
      setOriginalProfile(data.user);
      setIsEditing(false);
      setToast({ message: "profile updated!", type: "success" });
    } catch (err) {
      setToast({ message: "Update failed", type: "error" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setProfile(originalProfile);
    setIsEditing(false);
  };

  const getFileName = (resume) => {
    if (!resume) return "";
    if (resume instanceof File) return resume.name;
    if (typeof resume === "string") {
      return (
        resume.split("/").pop().split("-").slice(1).join("-") ||
        resume.split("/").pop()
      );
    }
    return "Resume";
  };

  const handleViewResume = () => {
    if (!profile.resume) return;

    if (profile.resume instanceof File) {
      const url = URL.createObjectURL(profile.resume);
      window.open(url, "_blank");
    } else if (typeof profile.resume === "string") {
      const fullUrl = `http://localhost:5000/api/user/resume/${originalProfile._id}`;

      const link = document.createElement("a");
      link.href = fullUrl;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className={s.container}>
      <div className={s.innerContainer}>
        {/* Header */}
        <div className={s.header}>
          <h1 className={s.headerTitle}>My Profile</h1>

          {!isEditing ? (
            <button onClick={() => setIsEditing(true)} className={s.editButton}>
              <Edit3 className={s.editIcon} />
              Edit Profile
            </button>
          ) : (
            <div className={s.actionButtons}>
              <button onClick={handleCancel} className={s.cancelButton}>
                <X className={s.cancelIcon} />
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className={`${s.saveButton} ${isSaving ? s.saveButtonDisabled : ""}`}
              >
                {isSaving ? (
                  <>
                    <Loader2 className={s.savingSpinner} />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className={s.saveIcon} />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Profile Card */}
        <div className={s.profileCard}>
          {/* Avatar */}
          <div className={s.avatarSection}>
            <div className={s.avatar}>
              {profile.name
                ? profile.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2)
                : "U"}
            </div>

            <div className={s.avatarInfo}>
              <h2 className={s.avatarName}>{profile.name || "Your Name"}</h2>
              <p className={s.avatarEmail}>
                <Mail className={s.avatarEmailIcon} />
                {profile.email || "email@example.com"}
              </p>
            </div>
          </div>

          {/* Fields */}
          <div className={s.formGrid}>
            {/* Name */}
            <div className={s.fieldGroup}>
              <label className={s.fieldLabel}>
                <User className={s.fieldIcon} />
                Full Name <span className={s.requiredStar}>*</span>
              </label>
              {isEditing ? (
                <input
                  type="text"
                  name="name"
                  value={profile.name}
                  onChange={handleChange}
                  className={s.input}
                  placeholder="John Doe"
                  required
                />
              ) : (
                <p className={s.displayText}>{profile.name}</p>
              )}
            </div>

            {/* Email */}
            <div className={s.fieldGroup}>
              <label className={s.fieldLabel}>
                <Mail className={s.fieldIcon} />
                Email <span className={s.requiredStar}>*</span>
              </label>
              {isEditing ? (
                <input
                  type="email"
                  name="email"
                  value={profile.email}
                  onChange={handleChange}
                  className={s.input}
                  placeholder="john@example.com"
                  required
                />
              ) : (
                <p className={s.displayText}>{profile.email}</p>
              )}
            </div>

            {/* Phone */}
            <div className={s.fieldGroup}>
              <label className={s.fieldLabel}>
                <Phone className={s.fieldIcon} />
                Phone <span className={s.requiredStar}>*</span>
              </label>
              {isEditing ? (
                <input
                  type="tel"
                  name="phone"
                  value={profile.phone}
                  onChange={handlePhoneChange}
                  className={s.input}
                  placeholder="1234567890 (10 digits)"
                  maxLength={10}
                  required
                />
              ) : (
                <p className={s.displayText}>{profile.phone}</p>
              )}
            </div>

            {/* Resume */}
            <div className={s.resumeSection}>
              <label className={s.fieldLabel}>
                <FileText className={s.fieldIcon} />
                Resume (PDF or Word)
              </label>
              {isEditing ? (
                <div className={s.resumeUploadWrapper}>
                  <div className={s.resumeUploadRow}>
                    <label className={s.resumeUploadLabel}>
                      <div className={s.resumeUploadBox}>
                        <Upload className={s.resumeUploadIcon} />
                        <span className={s.resumeFileName}>
                          {profile.resume
                            ? getFileName(profile.resume)
                            : "Choose file..."}
                        </span>
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                        onChange={handleResumeUpload}
                      />
                    </label>
                    {profile.resume && (
                      <button
                        onClick={handleDeleteResume}
                        className={s.resumeDeleteButton}
                        title="Delete resume"
                      >
                        <Trash2 className={s.resumeDeleteIcon} />
                      </button>
                    )}
                  </div>
                  {profile.resume && (
                    <p className={s.resumeSuccessText}>
                      File uploaded: {profile.resume.name || "Uploaded Resume"}
                    </p>
                  )}
                </div>
              ) : (
                <div>
                  {profile.resume ? (
                    <button
                      onClick={handleViewResume}
                      className={s.resumeViewButton}
                    >
                      <FileText className={s.resumeViewIcon} />
                      View Resume{" "}
                      {profile.resume ? `(${getFileName(profile.resume)})` : ""}
                    </button>
                  ) : (
                    <p className={s.noResumeText}>No resume uploaded</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Animations */}
      <style>{s.globalStyles}</style>
    </div>
  );
};

export default ViewProfilePage;
