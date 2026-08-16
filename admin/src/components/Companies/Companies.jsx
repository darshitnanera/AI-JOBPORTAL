// src/components/Companies.jsx
import React, { useState, useEffect, useRef } from "react";
import {
  Upload,
  Link2,
  CheckCircle,
  XCircle,
  X,
  Trash2,
  Loader2,
} from "lucide-react";
import axios from "axios";
import { companiesPageStyles as s } from "../../assets/dummyStyles";

const Companies = () => {
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState("");
  const [website, setWebsite] = useState("");
  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const token = localStorage.getItem("token");

        const res = await axios.get("/api/company/", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setCompanies(res.data.companies);
      } catch (err) {
        console.error(err);
      }
    };

    fetchCompanies();
  }, []);

  useEffect(() => {
    if (!toast || toast.confirm) return;

    const timer = setTimeout(() => {
      setToast(null);
    }, 3000);

    return () => clearTimeout(timer);
  }, [toast]);

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result);
        try {
          if (fileInputRef.current) fileInputRef.current.value = "";
        } catch (err) {
          /* ignore */
        }
      };
      reader.readAsDataURL(file);
    } else {
      setLogoFile(null);
      setLogoPreview("");
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!logoFile) newErrors.logo = "Logo is required";
    if (!website.trim()) {
      newErrors.website = "Website URL is required";
    } else if (!/^https?:\/\/.+\..+/.test(website)) {
      newErrors.website = "Enter a valid URL (e.g., https://example.com)";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsLoading(true);

    try {
      const token = localStorage.getItem("token");

      const formData = new FormData();
      formData.append("logo", logoFile);
      formData.append("website", website.trim());

      const res = await axios.post(
        "/api/company",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      setCompanies((prev) => [res.data.company, ...prev]);
      setToast({ type: "success", message: "Company added successfully!" });

      setLogoFile(null);
      setLogoPreview("");
      setWebsite("");
      setErrors({});
    } catch (err) {
      setToast({
        type: "error",
        message: err.response?.data?.message || "Failed to add company",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const requestDeleteCompany = (companyId) => {
    setPendingDeleteId(companyId);
    setToast({
      type: "confirm",
      confirm: true,
      message: "Are you sure you want to delete this company?",
    });
  };

  const handleConfirmDelete = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(
        `/api/company/${pendingDeleteId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      setCompanies((prev) => prev.filter((c) => c._id !== pendingDeleteId));
      setPendingDeleteId(null);
      setToast({
        type: "success",
        message: "Company deleted successfully",
      });
    } catch (err) {
      setToast({
        type: "error",
        message: err.response?.data?.message || "Delete failed",
      });
    }
  };

  const handleCancelDelete = () => {
    setPendingDeleteId(null);
    setToast(null);
  };

  return (
    <div className={s.pageContainer}>
      {/* Toast Notification */}
      {toast && (
        <div className={s.toastWrapper}>
          <div
            className={`${s.toastBase} ${
              toast.type === "success"
                ? s.toastSuccess
                : toast.type === "error"
                  ? s.toastError
                  : s.toastConfirm
            }`}
          >
            {toast.type === "success" ? (
              <CheckCircle size={20} className={s.toastIconSuccess} />
            ) : toast.type === "error" ? (
              <XCircle size={20} className={s.toastIconError} />
            ) : (
              <XCircle size={20} className={s.toastIconConfirm} />
            )}

            <div className={s.toastContent}>
              <span className={s.toastMessage}>{toast.message}</span>

              {toast.confirm && (
                <div className={s.toastActionRow}>
                  <button
                    onClick={handleConfirmDelete}
                    className={s.toastConfirmBtn}
                  >
                    Confirm
                  </button>
                  <button
                    onClick={handleCancelDelete}
                    className={s.toastCancelBtn}
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>

            {!toast.confirm && (
              <button
                onClick={() => setToast(null)}
                className={s.toastCloseBtn}
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>
      )}

      <div className={s.contentWrapper}>
        {/* Header */}
        <header className={s.header}>
          <h1 className={s.headerTitle}>Add Company</h1>
          <p className={s.headerSubtitle}>
            Upload logo and provide website URL
          </p>
        </header>

        {/* Form Card */}
        <div className={s.formCard}>
          <form onSubmit={handleSubmit} className={s.form}>
            {/* Logo Upload */}
            <div>
              <label className={s.logoLabel}>
                Company Logo <span className={s.requiredStar}>*</span>
              </label>
              <div className={s.logoContainer}>
                {/* Preview */}
                <div className={s.previewWrapper}>
                  {logoPreview ? (
                    <div className={s.previewBox}>
                      <img
                        src={logoPreview}
                        alt="Logo preview"
                        className={s.previewImage}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setLogoFile(null);
                          setLogoPreview("");
                          try {
                            if (fileInputRef.current)
                              fileInputRef.current.value = "";
                          } catch (err) {
                            /* ignore */
                          }
                        }}
                        className={s.removeLogoBtn}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <div className={s.placeholderBox}>
                      <Upload size={24} />
                    </div>
                  )}
                </div>

                {/* Upload Button */}
                <div className={s.uploadArea}>
                  <label htmlFor="logo-upload" className={s.uploadLabel}>
                    <Upload size={16} />
                    <span>Choose file</span>
                  </label>
                  <input
                    id="logo-upload"
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,jpeg,image/svg+xml,.ico"
                    onChange={handleLogoChange}
                    className={s.fileInputHidden}
                  />
                </div>
              </div>
              {errors.logo && <p className={s.errorText}>{errors.logo}</p>}
            </div>

            {/* Website URL */}
            <div>
              <label className={s.websiteLabel}>
                Website URL <span className={s.requiredStar}>*</span>
              </label>
              <div className={s.inputWrapper}>
                <Link2 size={18} className={s.inputIcon} />
                <input
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  className={`${s.websiteInput} ${
                    errors.website ? s.inputError : s.inputDefault
                  }`}
                  placeholder="https://example.com"
                />
              </div>
              {errors.website && (
                <p className={s.errorText}>{errors.website}</p>
              )}
            </div>

            {/* Submit Button */}
            <div className={s.submitSection}>
              <button
                type="submit"
                disabled={isLoading}
                className={`${s.submitBtn} ${isLoading ? s.submitBtnDisabled : ""}`}
              >
                {isLoading ? (
                  <>
                    <Loader2 size={20} className={s.spinner} />
                    Adding Company...
                  </>
                ) : (
                  "Add Company"
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Companies List */}
        {companies.length > 0 && (
          <div className={s.listSection}>
            <h2 className={s.listTitle}>Companies</h2>
            <div className={s.grid}>
              {companies.map((c) => (
                <div key={c._id} className={s.companyCard}>
                  {/* logo */}
                  <div className={s.cardLogoWrapper}>
                    <div className={s.cardLogoBox}>
                      {c.logo ? (
                        <img
                          src={c.logo}
                          alt="company logo"
                          className={s.cardLogoImage}
                        />
                      ) : (
                        <div className={s.cardNoImage}>No image</div>
                      )}
                    </div>
                  </div>

                  {/* details */}
                  <div className={s.cardDetails}>
                    <a
                      href={c.website}
                      target="_blank"
                      rel="noreferrer"
                      className={s.cardLink}
                    >
                      {c.website}
                    </a>
                  </div>

                  {/* delete icon */}
                  <div className={s.cardDeleteWrapper}>
                    <button
                      onClick={() => requestDeleteCompany(c._id)}
                      className={s.deleteBtn}
                      title="Delete company"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Tailwind Custom Animation */}
      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        .animate-slideIn {
          animation: slideIn 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default Companies;
